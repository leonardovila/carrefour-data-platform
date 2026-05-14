import base64
import json
from curl_cffi import requests

def build_extensions_payload(category_id, from_idx, to_idx):
    # 1. Las variables reales de búsqueda
    inner_vars = {
        "hideUnavailableItems": False,
        "skusFilter": "ALL_AVAILABLE",
        "installmentCriteria": "MAX_WITHOUT_INTEREST",
        "category": str(category_id),
        "collection": "", 
        "specificationFilters": [],
        "orderBy": "OrderByTopSaleDESC",
        "from": from_idx,
        "to": to_idx,
        "shippingOptions": [],
        "variant": "null-null",
        "advertisementOptions": {
            "showSponsored": False,
            "sponsoredCount": 0,
            "repeatSponsoredProducts": False,
            "advertisementPlacement": "home_shelf"
        }
    }
    
    # 2. Pasamos a string y codificamos en Base64
    inner_json_str = json.dumps(inner_vars, separators=(',', ':'))
    b64_vars = base64.b64encode(inner_json_str.encode('utf-8')).decode('utf-8')
    
    # 3. Anidamos el Base64 ADENTRO de extensions (Acá estaba la falla del 500)
    extensions = {
        "persistedQuery": {
            "version": 1,
            "sha256Hash": "ee2478d319404f621c3e0426e79eba3997665d48cb277a53bf0c3276e8e53c22",
            "sender": "vtex.store-resources@0.x",
            "provider": "vtex.search-graphql@0.x"
        },
        "variables": b64_vars
    }
    
    return json.dumps(extensions, separators=(',', ':'))

def test_vtex_ingestion():
    print("[*] Iniciando test de infiltración en VTEX IO...")
    
    session = requests.Session(impersonate="chrome110")
    
    headers = {
        "accept": "*/*",
        "accept-language": "es-AR,es;q=0.9",
        "content-type": "application/json",
        "origin": "https://www.carrefour.com.ar",
        "referer": "https://www.carrefour.com.ar/"
    }

    url = "https://www.carrefour.com.ar/_v/segment/graphql/v1"
    
    params = {
        "workspace": "master",
        "maxAge": "short",
        "appsEtag": "remove",
        "domain": "store",
        "locale": "es-AR",
        "operationName": "Products",
        "variables": "{}", # PRIMER NIVEL VACÍO
        "extensions": build_extensions_payload(3, 0, 9) # PAYLOAD ANIDADO (10 items)
    }

    try:
        response = session.get(url, headers=headers, params=params, timeout=15)
        print(f"[>] HTTP Status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            products = data.get("data", {}).get("products", [])
            print(f"[$$$] ¡Ingesta exitosa! SKUs capturados: {len(products)}")
            
            if products:
                print("\n--- Muestra del Dato (Tier Bronce) ---")
                print(f"Nombre: {products[0].get('productName')}")
                print(f"ID Producto: {products[0].get('productId')}")
                print(f"Categorías: {products[0].get('categories')}")
                
        else:
            print("[!] WAF Block o Error del Servidor. Analizando respuesta cruda:")
            print(response.text) # NUNCA MÁS VOLAR A CIEGAS
            
    except Exception as e:
        print(f"[X] Fallo de conexión: {e}")

if __name__ == "__main__":
    test_vtex_ingestion()