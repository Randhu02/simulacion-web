import pandas as pd
import os
import json

# Ruta de la carpeta donde están los Excel
carpeta_excel = 'simulacion-web/tablas'
ruta_completa = os.path.join(os.getcwd(), carpeta_excel)

# Carpeta donde se guardarán los JSON (puede ser la misma o una nueva)
carpeta_salida = os.path.join(os.getcwd(), 'simulacion-web', 'data')
os.makedirs(carpeta_salida, exist_ok=True)

# Recorre todos los archivos .xlsx en la carpeta
for archivo in os.listdir(ruta_completa):
    if archivo.endswith('.xlsx'):
        nombre_base = os.path.splitext(archivo)[0]  # Sin la extensión
        ruta_archivo = os.path.join(ruta_completa, archivo)

        try:
            df = pd.read_excel(ruta_archivo)
            json_path = os.path.join(carpeta_salida, f"{nombre_base}.json")

            # Exportar a JSON (orientado como lista de registros)
            df.to_json(json_path, orient='records', indent=2, force_ascii=False)
            print(f"✅ Convertido: {archivo} → {nombre_base}.json")
        except Exception as e:
            print(f"❌ Error con {archivo}: {e}")
