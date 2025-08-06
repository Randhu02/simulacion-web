import subprocess

def run_command(cmd):
    print(f"Ejecuntando: {cmd}")
    result = subprocess.run(cmd, shell=True, capture_output=True, text=True)
    if result.returncode != 0:
        print(f"Error en comando: {cmd}")
        print(result.stderr)
        return False
    return True

def git_push(repo_path, mensaje_commit, url_remoto):
    # Mover al directorio del repo
    import os
    os.chdir(repo_path)

    # Inicializar git si no está (no da error si ya está)
    run_command("git init")

    # Agregar todos los archivos
    if not run_command("git add ."):
        return

    # Commit con mensaje
    if not run_command(f'git commit -m "{mensaje_commit}"'):
        print("No se pudo hacer commit. Quizás no hay cambios.")
        # No abortamos aquí, puede que solo no haya nada nuevo

    # Verificar si existe remoto origin
    result = subprocess.run("git remote get-url origin", shell=True, capture_output=True, text=True)
    if result.returncode != 0:
        print("No existe remoto origin, se agrega...")
        if not run_command(f"git remote add origin {url_remoto}"):
            return
    else:
        print(f"Remoto origin ya existe: {result.stdout.strip()}")

    # Hacer push con -u para crear rama remota y hacer seguimiento
    if not run_command("git push -u origin main"):
        print("Fallo push, intentando forzar...")
        run_command("git push -u origin main --force")

if __name__ == "__main__":
    ruta_repo = r"C:\Users\Usuario\Desktop\PROYECTO TISUR\simulacion-web"
    mensaje = "Actualizo página con carga dinámica de imágenes desde JSON"
    url = "https://github.com/randhu02/simulacion-web.git"
    git_push(ruta_repo, mensaje, url)
