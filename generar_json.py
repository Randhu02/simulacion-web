import os
import json

def generar_diccionario_imagenes(base_path):
    resultado = {}

    # Recorremos cada producto (ej: Producto_Bobinas)
    for producto in os.listdir(base_path):
        ruta_producto = os.path.join(base_path, producto)
        if not os.path.isdir(ruta_producto):
            continue

        resultado[producto] = {}

        # Recorremos subcarpetas dentro del producto (ej: Desglose, Prediccion)
        for subcarpeta in os.listdir(ruta_producto):
            ruta_subcarpeta = os.path.join(ruta_producto, subcarpeta)
            if not os.path.isdir(ruta_subcarpeta):
                continue

            # Caso especial: si hay subcarpetas dentro de subcarpeta (ej: Prediccion/Prediccion_bobinas)
            subdirs = [d for d in os.listdir(ruta_subcarpeta) if os.path.isdir(os.path.join(ruta_subcarpeta, d))]
            if subdirs:
                resultado[producto][subcarpeta] = {}
                for subdir in subdirs:
                    ruta_subdir = os.path.join(ruta_subcarpeta, subdir)
                    imagenes = [f for f in os.listdir(ruta_subdir) if f.lower().endswith(('.png','.jpg','.jpeg'))]
                    resultado[producto][subcarpeta][subdir] = imagenes
            else:
                # No hay subcarpetas, solo imágenes
                imagenes = [f for f in os.listdir(ruta_subcarpeta) if f.lower().endswith(('.png','.jpg','.jpeg'))]
                resultado[producto][subcarpeta] = imagenes

    return resultado

if __name__ == "__main__":
    base = "imagenes"  # Ajusta si tu carpeta está en otro lugar
    dicc = generar_diccionario_imagenes(base)

    output_path = os.path.join("simulacion-web", "imagenes.json")
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(dicc, f, indent=2, ensure_ascii=False)

    print("Archivo 'imagenes.json' generado correctamente.")
