import Product from "@models/productModel"
import connectMongoDB from "@libs/mongodb"
import { NextResponse } from "next/server"
import Inventory from "@models/inventoryModel"

export async function POST(request) {
    try {

        await connectMongoDB()

        const { reason, cart, user } = await request.json()

        for (const item of cart) {
            const { cod, amount, total } = item

            const product = await Product.findOne({ cod: cod })

            if (!product) {
                return NextResponse.json(
                    { message: `Producto con código ${cod} no encontrado` },
                    { status: 404 }
                )
            }

            let method = 'Entrada'

            if (amount < 0) {
                method = 'Salida'
            }

            await Product.updateOne(
                { cod },
                {
                    $set: { stock: total },
                },
            )

            if (method === 'Entrada') {
                const inventory = new Inventory({
                    cod, name: product.name, newStock: total, amount, reason, method, user
                })
                await inventory.save()

            } else {
                const inventory = new Inventory({
                    cod, name: product.name, newStock: total, amount, reason, method, user
                })
                await inventory.save()
            }

        }

        return NextResponse.json(
            {
                message: "Inventory updated succesfully!"
            },
            {
                status: 200
            }
        )

    } catch (e) {
        return NextResponse.json(
            {
                message: "Something went wrong:", e
            },
            {
                status: 500
            }
        )
    }
}