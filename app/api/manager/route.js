import connectMongoDB from "@libs/mongodb"
import Client from "@models/clientModel"
import Inventory from "@models/inventoryModel"
import Product from "@models/productModel"
import Sale from "@models/saleModel"
import moment from "@node_modules/moment-timezone"
import { NextResponse } from "next/server"

export async function POST(request) {
    try {

        await connectMongoDB()

        const { month, year } = await request.json()

        if (month === null || year === null) {
            return NextResponse.json(
                {
                    data: {
                        totalSales: 0
                    }
                },
                {
                    status: 200
                }
            )
        }

        /* VENTAS */

        const startOfMonth = moment.tz(`${year}-${String(month + 1).padStart(2, '0')}-01`, "America/Guayaquil").startOf('month')
        const endOfMonth = moment.tz(`${year}-${String(month + 1).padStart(2, '0')}-01`, "America/Guayaquil").endOf('month')

        const sales = await Sale.find({
            updatedAt: {
                $gte: startOfMonth.toDate(),
                $lte: endOfMonth.toDate(),
            },
            status: 'Completa',
        }).select('total cart saler createdAt')

        let totalSales = 0

        const productSalesCount = []

        const sellerSales = {}

        sales.forEach(sale => {
            totalSales += sale.total

            if (sale.saler) {
                if (!sellerSales[sale.saler]) {
                    sellerSales[sale.saler] = 0
                }
                sellerSales[sale.saler] += sale.total
            }

            sale.cart.forEach(item => {
                const productCode = item.cod
                const productName = item.name
                const quantity = Number(item.amount)

                const existingProduct = productSalesCount.find(product => product.cod === productCode)

                if (existingProduct) {
                    existingProduct.quantity += quantity
                } else {
                    productSalesCount.push({
                        cod: productCode,
                        name: productName,
                        quantity: quantity
                    })
                }
            })
        })

        const sortedProducts = productSalesCount.sort((a, b) => b.quantity - a.quantity)

        const top5Products = sortedProducts.slice(0, 5)

        const topSellers = Object.entries(sellerSales)
            .map(([name, total]) => ({ name, total }))
            .sort((a, b) => b.total - a.total)
            .slice(0, 3)

        /* ENTRADAS Y SALIDAS */

        console.log(startOfMonth)

        const entries = await Inventory.aggregate([
            {
                $match: {
                    method: "Entrada",
                    createdAt: { $gte: startOfMonth.toDate(), $lt: endOfMonth.toDate() },
                },
            },
            {
                $group: {
                    _id: null, // No grouping by a specific field; group all matching documents
                    totalAmount: { $sum: "$amount" }, // Sum the 'amount' field
                },
            },
        ])

        const totalEntries = entries.length > 0 ? entries[0].totalAmount : 0;

        const exits = await Inventory.aggregate([
            {
                $match: {
                    method: "Salida",
                    createdAt: { $gte: startOfMonth.toDate(), $lt: endOfMonth.toDate() },
                },
            },
            {
                $group: {
                    _id: null, 
                    totalAmount: { $sum: { $abs: "$amount" } }, 
                },
            },
        ])

        const totalExits = exits.length > 0 ? exits[0].totalAmount : 0;
        
        
        /* TOTALES */

        const totalClients = await Client.countDocuments()

        const totalProducts = await Product.countDocuments()

        const productsStock = await Product.find().select("stock")

        const totalStock = productsStock.reduce((sum, product) => {
            if (product.stock > 0) {
                return sum + product.stock;
            }
            return sum;
        }, 0)


        const data = {
            totalSales: totalSales.toFixed(2),
            top5Products,
            totalExits,
            totalEntries,
            topSellers,
            totalClients,
            totalProducts,
            totalStock
        }

        return NextResponse.json(
            {
                data
            },
            {
                status: 200
            }
        )
    } catch (e) {
        return NextResponse.json(
            {
                message: "Something went wrong: " + e
            },
            {
                status: 500
            }
        )
    }
}