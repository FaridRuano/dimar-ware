import connectMongoDB from "@libs/mongodb";
import Product from "@models/productModel";
import { NextResponse } from "next/server";

export async function GET(request) {
    await connectMongoDB();

    const products = await Product.find().select('inventory name stock');

    if (!products || products.length === 0) {
        return NextResponse.json(
            { message: 'No products found' },
            { status: 404 }
        );
    }

    const getEcuadorTime = (date = new Date()) => {
        return new Date(date.toLocaleString("en-US", { timeZone: "America/Guayaquil" }));
    };

    const todayStart = getEcuadorTime();
    todayStart.setHours(0, 0, 0, 0);

    const todayEnd = getEcuadorTime();
    todayEnd.setHours(23, 59, 59, 999);

    let totalInventory = 0;
    let entriesToday = 0;
    let exitsToday = 0;
    let lowStockProducts = [];
    const latestEntriesExits = [];

    for (const product of products) {
        totalInventory += parseFloat(product.stock);

        if (!product.inventory || product.inventory.length === 0) {
            console.log('Inventario vacío, se ignora este producto');
        } else {
            const todayRecords = product.inventory.filter(record => {
                if (!record.date) return false;
                const recordDate = new Date(record.date);
                return recordDate >= todayStart && recordDate <= todayEnd;
            });

            entriesToday += todayRecords.filter(record => record.method === 'Entrada').length;
            exitsToday += todayRecords.filter(record => record.method === 'Salida').length;

            // Agregar registros recientes de este producto al arreglo principal
            product.inventory
                .slice()
                .sort((a, b) => new Date(b.date) - new Date(a.date)) // Ordenar registros del producto por fecha
                .slice(0, 15) // Tomar solo los 15 más recientes
                .forEach(record => {
                    latestEntriesExits.push({
                        name: product.name,
                        amount: record.amount,
                        method: record.method,
                        date: record.date, // Asegúrate de incluir la fecha para ordenar luego
                    });
                });
        }
    }

    // Ordenar el arreglo unificado por fecha DESCENDENTE
    latestEntriesExits.sort((a, b) => new Date(b.date) - new Date(a.date));

    // Obtener los productos con menor stock (los primeros 4)
    const sortedProducts = products.sort((a, b) => a.stock - b.stock);
    lowStockProducts = sortedProducts.slice(0, 4);

    return NextResponse.json(
        {
            totalInventory,
            entriesToday,
            exitsToday,
            lowStockProducts,
            latestEntriesExits,
        },
        { status: 200 }
    );
}
