from fastapi import FastAPI

app = FastAPI(title="SGMA - Sistema de Gestión de Mantenimiento")

@app.get("/")
def inicio():
    return {
        "mensaje": "Bienvenido al sistema SGMA",
        "estado": "Funcionando correctamente"
    }
    
