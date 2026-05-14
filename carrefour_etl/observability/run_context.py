from __future__ import annotations
import json
import time
import traceback
from dataclasses import dataclass, field
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, Optional, Iterator, List, IO
from contextlib import contextmanager

from carrefour_etl.storage.paths import LOGS_DIR


def _now_iso() -> str:
    return datetime.now().astimezone().isoformat()


def _safe_json(obj: Any) -> Any:
    if obj is None or isinstance(obj, (str, int, float, bool)):
        return obj
    if isinstance(obj, (list, tuple)):
        return [_safe_json(x) for x in obj]
    if isinstance(obj, dict):
        return {str(k): _safe_json(v) for k, v in obj.items()}
    return repr(obj)


@dataclass
class RunContext:
    run_name: str
    run_id: str = field(default_factory=lambda: datetime.now().strftime("%Y-%m-%d_%H-%M-%S"))
    logs_dir: Path = field(default_factory=lambda: LOGS_DIR)
    log_path: Path = field(init=False)
    report_path: Path = field(init=False)
    report: Dict[str, Any] = field(default_factory=dict)
    _t0: float = field(default_factory=time.perf_counter)
    _span_stack: List[str] = field(default_factory=list)
    _log_fh: Optional[IO[str]] = field(default=None, init=False, repr=False)
    console: bool = True
    console_flush: bool = False

    def __post_init__(self) -> None:
        self.log_path = self.logs_dir / f"RUN_{self.run_id}_{self.run_name}.jsonl"
        self._log_fh = open(self.log_path, "a", encoding="utf-8")
        self.report_path = self.logs_dir / f"REPORT_{self.run_id}_{self.run_name}.json"
        self.report = {
            "run_id": self.run_id,
            "run_name": self.run_name,
            "started_at": _now_iso(),
            "status": "running",
            "stages": {},
        }
        self.event("run_start", level="INFO", run_name=self.run_name)

    def event(self, name: str, *, level: str = "INFO", stage: Optional[str] = None, **data: Any) -> None:
        rec = {
            "ts": _now_iso(),
            "run_id": self.run_id,
            "level": level,
            "event": name,
            "stage": stage,
            **_safe_json(data),
        }
        line = json.dumps(rec, ensure_ascii=False) + "\n"
        if self.console:
            print(line, end="")
            if self.console_flush:
                try:
                    import sys
                    sys.stdout.flush()
                except Exception:
                    pass
        if self._log_fh is None:
            self._log_fh = open(self.log_path, "a", encoding="utf-8")
        self._log_fh.write(line)

    def stage_ok(self, stage: str, **data: Any) -> None:
        payload = {"status": "ok", **_safe_json(data)}
        self.report["stages"][stage] = payload
        self.event("stage_ok", level="INFO", stage=stage, **payload)

    def stage_err(self, stage: str, exc: BaseException, **data: Any) -> None:
        tb = "".join(traceback.format_exception(type(exc), exc, exc.__traceback__))
        payload = {
            "status": "error",
            "error_type": type(exc).__name__,
            "error_msg": str(exc),
            "traceback": tb,
            **_safe_json(data),
        }
        self.report["stages"][stage] = payload
        self.event("stage_err", level="ERROR", stage=stage, **payload)

    @contextmanager
    def span(self, stage: str, **data: Any) -> Iterator[None]:
        t0 = time.perf_counter()
        parent = self._span_stack[-1] if self._span_stack else None
        self._span_stack.append(stage)
        self.event("stage_start", level="INFO", stage=stage, parent_stage=parent, **data)
        try:
            yield
        except BaseException as exc:
            dt = round(time.perf_counter() - t0, 6)
            self.stage_err(stage, exc, duration_s=dt, parent_stage=parent, **data)
            raise
        else:
            dt = round(time.perf_counter() - t0, 6)
            self.stage_ok(stage, duration_s=dt, parent_stage=parent, **data)
        finally:
            if self._span_stack and self._span_stack[-1] == stage:
                self._span_stack.pop()
            else:
                self.event("span_stack_mismatch", level="ERROR", stage=stage, stack=list(self._span_stack))

    def write_report(self) -> None:
        with open(self.report_path, "w", encoding="utf-8") as f:
            json.dump(_safe_json(self.report), f, ensure_ascii=False, indent=2)

    def finalize(self, *, status: str) -> Dict[str, Any]:
        if status not in ("success", "error"):
            status = "error"
        dt = time.perf_counter() - self._t0
        self.report["finished_at"] = _now_iso()
        self.report["duration_s"] = round(dt, 6)
        self.report["status"] = status
        self.event("run_finish", level="INFO" if status == "success" else "ERROR",
                   status=status, duration_s=self.report["duration_s"])
        if self._log_fh is not None:
            try:
                self._log_fh.flush()
            finally:
                self._log_fh.close()
                self._log_fh = None
        self.write_report()
        return self.report

    def __del__(self) -> None:
        try:
            if self._log_fh is not None:
                self._log_fh.close()
        except Exception:
            pass
