
export const PROMOCIONES =
{
    BONIFICADO: "BONIFICADO",
    ESCALA: "ESCALA",
    ESCALA_BONIFICADO: "ESCALA_BONIFICADO",
    NO_ESCALA_BONIFICADO: "NO_ESCALA_BONIFICADO",
}

export const monedas = [
    { value: 'PEN', label: 'Soles (PEN)' },
    { value: 'USD', label: 'Dólares (USD)' },
];


export const MESSAGES = {
    BONIFICADO: {
        title: "Buscando bonificaciones",
        message: "Por favor, espere mientras buscamos las bonificaciones disponibles."
    },
    ESCALA: {
        title: "Buscando escalas disponibles",
        message: "Por favor, espere mientras buscamos las escalas disponibles."
    },
    EVALUACION: {
        title: "Actualizando evaluación",
        message: "Por favor, espere mientras actualizamos la evaluación."
    }
} 

export const NAME_ROLES = {
    ADMIN:"ADMIN",
    VENDEDOR:"VENDEDOR",
    USUARIO:"USUARIO",
    ADMIN_VENDEDOR:["ADMIN","VENDEDOR"],
    ADMIN_USUARIO:["ADMIN","USUARIO"],
    ALL:["ADMIN","VENDEDOR","USUARIO"]
} 