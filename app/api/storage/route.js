import connectMongoDB from "@libs/mongodb";
import Inventory from "@models/inventoryModel";
import Product from "@models/productModel";
import { NextResponse } from "next/server";

export async function GET(request) {
    await connectMongoDB();

    const startOfDay = new Date()
    startOfDay.setHours(0, 0, 0, 0)

    const endOfDay = new Date()
    endOfDay.setHours(23, 59, 59, 999)

    const products = await Product.find().select('name stock').sort({ stock: 1 }).limit(5)

    if (!products || products.length === 0) {
        return NextResponse.json(
            { message: 'No products found' },
            { status: 404 }
        );
    }

    let totalInventory = 0;
    let entriesToday = 0;
    let exitsToday = 0;
    let lowStockProducts = [];

    const totalStock = await Product.aggregate([
        {
            $group: {
                _id: null, 
                totalStock: { $sum: "$stock" }, 
            },
        },
    ]);

    totalInventory = totalStock.length > 0 ? totalStock[0].totalStock : 0;

    const exists = await Inventory.countDocuments({ method: "Salida" })

    const entries = await Inventory.countDocuments({ method: "Entrada" })

    exitsToday = exists

    entriesToday = entries

    const latestMoves = await Inventory.find({ updatedAt: { $gte: startOfDay, $lt: endOfDay } })
        .sort({ updatedAt: -1 })
        .limit(15)

    let data = latestMoves

    lowStockProducts = products

    return NextResponse.json(
        {
            totalInventory,
            entriesToday,
            exitsToday,
            lowStockProducts,
            data,
        },
        { status: 200 }
    );
}
