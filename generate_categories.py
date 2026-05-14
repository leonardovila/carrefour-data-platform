import requests
import json

def get_vtex_category_tree(depth=3):
    print(f"[*] Descargando topología de la base de datos (Profundidad: {depth})...")
    url = f"https://www.carrefour.com.ar/api/catalog_system/pub/category/tree/{depth}"
    
    headers = {
        "accept": "application/json",
        "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
    }

    response = requests.get(url, headers=headers, timeout=10)
    
    if response.status_code == 200:
        return response.json()
    else:
        print(f"[!] Error HTTP {response.status_code}")
        return None

def extract_leaf_categories(category_tree):
    leaf_nodes = []

    def traverse(node):
        # Si tiene hijos (children), iteramos sobre ellos
        if node.get("hasChildren") and node.get("children"):
            for child in node["children"]:
                traverse(child)
        else:
            # Si no tiene hijos, es un nodo hoja (la categoría más específica)
            leaf_nodes.append({
                "id": node.get("id"),
                "name": node.get("name"),
                "url": node.get("url")
            })

    for category in category_tree:
        traverse(category)

    return leaf_nodes

if __name__ == "__main__":
    tree = get_vtex_category_tree(3)
    
    if tree:
        leaf_categories = extract_leaf_categories(tree)
        
        # Guardamos el mapa para dárselo de comer a nuestro extractor GraphQL después
        with open("carrefour_category_map.json", "w", encoding="utf-8") as f:
            json.dump(leaf_categories, f, ensure_ascii=False, indent=2)
            
        print(f"[$$$] Mapa completado. Se encontraron {len(leaf_categories)} categorías específicas listas para ingestar.")
        
        # Muestra rápida de los primeros 5 objetivos
        print("\n--- Primeros 5 Targets ---")
        for cat in leaf_categories[:5]:
            print(f"ID: {cat['id']} | Categoría: {cat['name']}")