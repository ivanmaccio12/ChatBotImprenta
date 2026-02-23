import XLSX from 'xlsx';
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const GOOGLE_SHEET_URL = process.env.GOOGLE_SHEET_URL;
const REFRESH_INTERVAL = parseInt(process.env.GOOGLE_SHEET_REFRESH_INTERVAL || '3600000', 10);

let cachedData = null;
let lastFetch = 0;

export const getSheetData = async () => {
    const now = Date.now();
    if (cachedData && (now - lastFetch < REFRESH_INTERVAL)) {
        return cachedData;
    }

    try {
        console.log('Fetching Google Sheet data...');
        const response = await axios.get(GOOGLE_SHEET_URL, { responseType: 'arraybuffer' });
        const workbook = XLSX.read(response.data, { type: 'buffer' });

        const data = {};
        workbook.SheetNames.forEach(sheetName => {
            const sheet = workbook.Sheets[sheetName];
            data[sheetName] = XLSX.utils.sheet_to_json(sheet, { header: 1 });
        });

        cachedData = data;
        lastFetch = now;
        return data;
    } catch (error) {
        console.error('Error fetching Google Sheet data:', error);
        if (cachedData) return cachedData;
        throw error;
    }
};

/**
 * Parses the Claves sheet into a lookup map: { clave: precioUnitario }
 */
const parseClavesLookup = (clavesRows) => {
    const lookup = {};
    // Skip header row (index 0)
    for (let i = 1; i < clavesRows.length; i++) {
        const row = clavesRows[i];
        if (row && row[0] && row[1] !== undefined) {
            lookup[String(row[0]).trim()] = row[1];
        }
    }
    return lookup;
};

/**
 * Parses the Precios vinilos sheet into a lookup map: { material: precioM2 }
 */
const parseVinilosPrices = (vinilosRows) => {
    const lookup = {};
    // Skip header row (index 0)
    for (let i = 1; i < vinilosRows.length; i++) {
        const row = vinilosRows[i];
        if (row && row[0] && row[1] !== undefined) {
            lookup[String(row[0]).trim()] = row[1];
        }
    }
    return lookup;
};

/**
 * Formats the raw sheet data into a string suitable for the system prompt.
 */
export const formatDataForPrompt = (data) => {
    let promptPart = "\n\n---\n## DATOS EN TIEMPO REAL DESDE EL SISTEMA DE PRECIOS\n\n";

    // --- Products list ---
    if (data['Productos-servicios']) {
        promptPart += "### CATÁLOGO DE PRODUCTOS Y SERVICIOS:\n";
        data['Productos-servicios'].forEach(row => {
            if (row && row.length > 0 && row[0]) {
                promptPart += `- ${row[0]}\n`;
            }
        });
    }

    // --- Claves lookup (fotocopy prices, precise) ---
    if (data['Claves']) {
        const lookup = parseClavesLookup(data['Claves']);
        promptPart += "\n### TABLA DE PRECIOS EXACTOS - FOTOCOPIAS Y SERVICIOS DE COPIADO:\n";
        promptPart += "*(Clave: Formato_Rango de cantidad_Gramaje_Faz_Tipo_Servicio → Precio unitario en ARS)*\n\n";
        promptPart += "| Clave | Precio unitario (ARS) |\n";
        promptPart += "|-------|----------------------|\n";
        for (const [key, price] of Object.entries(lookup)) {
            promptPart += `| ${key} | $${Number(price).toLocaleString('es-AR')} |\n`;
        }
        promptPart += "\n**INSTRUCCIÓN CRÍTICA PARA COTIZACIONES DE FOTOCOPIAS:**\n";
        promptPart += "1. Identifica: Formato (A4/A3), rango de cantidad (1 a 10 / 11 a 50 / 51 a 100 / Más de 100), Gramaje (80g/170g/270g), Faz (Simple/Doble), Tipo (Color/Blanco y negro), Servicio (Fotocopia).\n";
        promptPart += "2. Construye la clave: `Formato_Rango_Gramaje_Faz_Tipo_Servicio`.\n";
        promptPart += "3. Busca el precio unitario en la tabla y multiplícalo por la cantidad solicitada.\n";
        promptPart += "4. Si el cliente no especifica gramaje, asume **80g**. Si no especifica faz, asume **Simple**.\n";
        promptPart += "5. Si la cantidad supera 100, usa SIEMPRE el rango **Más de 100** en la clave.\n";
        promptPart += "6. Muestra el precio unitario y el total calculado.\n\n";
    }

    // --- Vinilos prices ---
    if (data['Precios vinilos']) {
        const vinilosPrices = parseVinilosPrices(data['Precios vinilos']);
        promptPart += "\n### TABLA DE PRECIOS - IMPRESIÓN Y VINILOS (precio por m²):\n";
        promptPart += "| Material | Precio por m² (ARS, sin IVA) |\n";
        promptPart += "|----------|------------------------------|\n";
        for (const [material, price] of Object.entries(vinilosPrices)) {
            promptPart += `| ${material} | $${Number(price).toLocaleString('es-AR')} |\n`;
        }
        promptPart += "\n**INSTRUCCIÓN PARA COTIZACIONES DE IMPRESIÓN:**\n";
        promptPart += "- El precio final = precio por m² × (Alto × Ancho). Aplicar IVA (21%) al total.\n";
        promptPart += "- Siempre preguntar las medidas (Alto y Ancho en metros) antes de cotizar.\n\n";
    }

    promptPart += "---\n";
    return promptPart;
};
