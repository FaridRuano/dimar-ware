import connectMongoDB from "@libs/mongodb"
import Inventory from "@models/inventoryModel"
import Product from "@models/productModel"
import Sale from "@models/saleModel"
import { NextResponse } from "next/server"

export async function POST(request) {
    try {

        await connectMongoDB()

        const { filter, type, initDate, endDate } = await request.json()

        const data = {
            xsData: [],
            data: [],
            val1: 0,
            val2: 0
        }


        if (!filter) {


            if (initDate !== '' && endDate !== '') {

                let startDate, endedDate
                startDate = new Date(initDate)
                endedDate = new Date(endDate)

                startDate.setUTCHours(0, 0, 0, 0)

                endedDate.setUTCHours(23, 59, 59, 0)

                let sales
                let totalAmount
                let sellers

                let lastMovements

                lastMovements = await Sale.aggregate([
                    {
                        $match: {
                            createdAt: { $gte: startDate, $lt: endedDate }
                        }
                    },
                    { $sort: { createdAt: -1 } }, // Ordenar por fecha de creación, descendente
                    { $limit: 15 }, // Limitar a las últimas 15 ventas
                    {
                        $project: {
                            _id: 1,
                            user: "$saler",
                            info: "$billData.name",
                            value: "$total"
                        }
                    }
                ])

                sales = await Sale.countDocuments({ createdAt: { $gte: startDate, $lt: endedDate } })
                totalAmount = await Sale.aggregate([
                    { $match: { createdAt: { $gte: startDate, $lt: endedDate } } },
                    { $group: { _id: null, total: { $sum: "$total" } } },
                ])

                sellers = await Sale.aggregate([
                    {
                        $match: {
                            createdAt: { $gte: startDate, $lt: endedDate },
                        },
                    },
                    {
                        $group: {
                            _id: "$saler",
                            totalSales: { $sum: "$total" },
                        },
                    },
                    {
                        $sort: { totalSales: -1 },
                    },
                    {
                        $limit: 4,
                    },
                    {
                        $project: {
                            _id: 0,
                            saler: "$_id",
                            totalSales: 1,
                        },
                    },
                ])

                data.val1 = sales
                data.val2 = totalAmount[0].total
                data.xsData = sellers
                data.data = lastMovements

            } else {
                let sales
                let totalAmount
                let sellers
                const today = new Date()


                today.setUTCHours(today.getUTCHours() - 5)

                let startDate, endDate

                let lastMovements

                lastMovements = await Sale.aggregate([
                    {
                        $match: {
                            createdAt: { $gte: startDate, $lt: endDate }, // Filtrar por el rango de tiempo seleccionado
                        },
                    },
                    { $sort: { createdAt: -1 } }, // Ordenar por fecha de creación, descendente
                    { $limit: 15 }, // Limitar a las últimas 15 ventas
                    {
                        $project: {
                            _id: 1,
                            user: "$saler",
                            info: "$billData.name",
                            value: "$total"
                        }
                    }
                ])

                switch (type) {
                    case 1:
                        startDate = new Date(today.getFullYear(), today.getMonth(), today.getDate())
                        startDate.setUTCHours(startDate.getUTCHours() - 5)

                        endDate = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1)
                        endDate.setUTCHours(endDate.getUTCHours() - 5)


                        sales = await Sale.countDocuments({ createdAt: { $gte: startDate, $lt: endDate } })

                        totalAmount = await Sale.aggregate([
                            { $match: { createdAt: { $gte: startDate, $lt: endDate } } },
                            { $group: { _id: null, total: { $sum: "$total" } } },
                        ])

                        sellers = await Sale.aggregate([
                            {
                                $match: {
                                    createdAt: { $gte: startDate, $lt: endDate }, // Filtrar por el rango de tiempo seleccionado
                                },
                            },
                            {
                                $group: {
                                    _id: "$saler", // Agrupar por el nombre del vendedor
                                    totalSales: { $sum: "$total" }, // Sumar el total de las ventas
                                },
                            },
                            {
                                $sort: { totalSales: -1 }, // Ordenar por total de ventas en orden descendente
                            },
                            {
                                $limit: 4, // Limitar a los 4 mejores vendedores
                            },
                            {
                                $project: {
                                    _id: 0, // Excluir el campo '_id' del resultado final
                                    saler: "$_id", // Renombrar el campo '_id' a 'saler' para representar el nombre del vendedor
                                    totalSales: 1, // Incluir el total de ventas
                                },
                            },
                        ])

                        lastMovements = await Sale.aggregate([
                            {
                                $match: {
                                    createdAt: { $gte: startDate, $lt: endDate }, // Filtrar por el rango de tiempo seleccionado
                                },
                            },
                            { $sort: { createdAt: -1 } }, // Ordenar por fecha de creación, descendente
                            { $limit: 15 }, // Limitar a las últimas 15 ventas
                            {
                                $project: {
                                    _id: 1,
                                    user: "$saler",
                                    info: "$billData.name",
                                    value: "$total"
                                }
                            }
                        ])

                        break

                    case 2: // Ventas de esta semana
                        const dayOfWeek = today.getDay(); // 0 (Sunday) to 6 (Saturday)

                        // Calculate start of the week (Monday at 00:00:00 UTC)
                        const startOfWeek = new Date(today);
                        startOfWeek.setDate(today.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1)); // Move to Monday
                        startOfWeek.setUTCHours(0, 0, 0, 0); // Set time to 00:00:00 UTC

                        // Calculate end of the week (Sunday at 23:59:59 UTC)
                        const endOfWeek = new Date(startOfWeek);
                        endOfWeek.setDate(startOfWeek.getDate() + 6); // Move to Sunday
                        endOfWeek.setUTCHours(23, 59, 59, 999); // Set time to 23:59:59.999 UTC

                        // Adjust for UTC-5 (Ecuador Timezone)
                        const startOfWeekEcuador = new Date(startOfWeek)
                        startOfWeekEcuador.setUTCHours(startOfWeekEcuador.getUTCHours() - 5)

                        const endOfWeekEcuador = new Date(endOfWeek);
                        endOfWeekEcuador.setUTCHours(endOfWeekEcuador.getUTCHours() - 5)

                        sales = await Sale.countDocuments({ createdAt: { $gte: startOfWeek, $lt: endOfWeek } })

                        totalAmount = await Sale.aggregate([
                            { $match: { createdAt: { $gte: startOfWeek, $lt: endOfWeek } } }, // Filtro por rango de fechas
                            { $group: { _id: null, total: { $sum: "$total" } } }, // Agrupa y suma el campo total
                        ])

                        sellers = await Sale.aggregate([
                            {
                                $match: {
                                    createdAt: { $gte: startOfWeek, $lt: endOfWeek }, // Filtrar por el rango de tiempo seleccionado
                                },
                            },
                            {
                                $group: {
                                    _id: "$saler", // Agrupar por el nombre del vendedor
                                    totalSales: { $sum: "$total" }, // Sumar el total de las ventas
                                },
                            },
                            {
                                $sort: { totalSales: -1 }, // Ordenar por total de ventas en orden descendente
                            },
                            {
                                $limit: 4, // Limitar a los 4 mejores vendedores
                            },
                            {
                                $project: {
                                    _id: 0, // Excluir el campo '_id' del resultado final
                                    saler: "$_id", // Renombrar el campo '_id' a 'saler' para representar el nombre del vendedor
                                    totalSales: 1, // Incluir el total de ventas
                                },
                            },
                        ])

                        lastMovements = await Sale.aggregate([
                            {
                                $match: {
                                    createdAt: { $gte: startOfWeek, $lt: endOfWeek }, // Filtrar por el rango de tiempo seleccionado
                                },
                            },
                            { $sort: { createdAt: -1 } }, // Ordenar por fecha de creación, descendente
                            { $limit: 15 }, // Limitar a las últimas 15 ventas
                            {
                                $project: {
                                    _id: 1,
                                    user: "$saler",
                                    info: "$billData.name",
                                    value: "$total"
                                }
                            }
                        ])
                        break

                    case 3: // Ventas de este mes
                        startDate = new Date(today.getFullYear(), today.getMonth(), 1) // Inicio del mes
                        startDate.setUTCHours(startDate.getUTCHours() - 5)

                        endDate = new Date(today.getFullYear(), today.getMonth() + 1, 1) // Inicio del próximo mes
                        endDate.setUTCHours(endDate.getUTCHours() - 5)

                        sales = await Sale.countDocuments({ createdAt: { $gte: startDate, $lt: endDate } })
                        totalAmount = await Sale.aggregate([
                            { $match: { createdAt: { $gte: startDate, $lt: endDate } } },
                            { $group: { _id: null, total: { $sum: "$total" } } },
                        ])
                        sellers = await Sale.aggregate([
                            {
                                $match: {
                                    createdAt: { $gte: startDate, $lt: endDate }, // Filtrar por el rango de tiempo seleccionado
                                },
                            },
                            {
                                $group: {
                                    _id: "$saler", // Agrupar por el nombre del vendedor
                                    totalSales: { $sum: "$total" }, // Sumar el total de las ventas
                                },
                            },
                            {
                                $sort: { totalSales: -1 }, // Ordenar por total de ventas en orden descendente
                            },
                            {
                                $limit: 4, // Limitar a los 4 mejores vendedores
                            },
                            {
                                $project: {
                                    _id: 0, // Excluir el campo '_id' del resultado final
                                    saler: "$_id", // Renombrar el campo '_id' a 'saler' para representar el nombre del vendedor
                                    totalSales: 1, // Incluir el total de ventas
                                },
                            },
                        ])
                        lastMovements = await Sale.aggregate([
                            {
                                $match: {
                                    createdAt: { $gte: startDate, $lt: endDate }, // Filtrar por el rango de tiempo seleccionado
                                },
                            },
                            { $sort: { createdAt: -1 } }, // Ordenar por fecha de creación, descendente
                            { $limit: 15 }, // Limitar a las últimas 15 ventas
                            {
                                $project: {
                                    _id: 1,
                                    user: "$saler",
                                    info: "$billData.name",
                                    value: "$total"
                                }
                            }
                        ])
                        break

                    case 4: // Ventas de este año
                        startDate = new Date(today.getFullYear(), 0, 1) // Inicio del año
                        startDate.setUTCHours(startDate.getUTCHours() - 5)

                        endDate = new Date(today.getFullYear() + 1, 0, 1) // Inicio del próximo año
                        endDate.setUTCHours(endDate.getUTCHours() - 5)

                        sales = await Sale.countDocuments({ createdAt: { $gte: startDate, $lt: endDate } })
                        totalAmount = await Sale.aggregate([
                            { $match: { createdAt: { $gte: startDate, $lt: endDate } } },
                            { $group: { _id: null, total: { $sum: "$total" } } },
                        ])
                        sellers = await Sale.aggregate([
                            {
                                $match: {
                                    createdAt: { $gte: startDate, $lt: endDate }, // Filtrar por el rango de tiempo seleccionado
                                },
                            },
                            {
                                $group: {
                                    _id: "$saler", // Agrupar por el nombre del vendedor
                                    totalSales: { $sum: "$total" }, // Sumar el total de las ventas
                                },
                            },
                            {
                                $sort: { totalSales: -1 }, // Ordenar por total de ventas en orden descendente
                            },
                            {
                                $limit: 4, // Limitar a los 4 mejores vendedores
                            },
                            {
                                $project: {
                                    _id: 0, // Excluir el campo '_id' del resultado final
                                    saler: "$_id", // Renombrar el campo '_id' a 'saler' para representar el nombre del vendedor
                                    totalSales: 1, // Incluir el total de ventas
                                },
                            },
                        ])
                        lastMovements = await Sale.aggregate([
                            {
                                $match: {
                                    createdAt: { $gte: startDate, $lt: endDate }, // Filtrar por el rango de tiempo seleccionado
                                },
                            },
                            { $sort: { createdAt: -1 } }, // Ordenar por fecha de creación, descendente
                            { $limit: 15 }, // Limitar a las últimas 15 ventas
                            {
                                $project: {
                                    _id: 1,
                                    user: "$saler",
                                    info: "$billData.name",
                                    value: "$total"
                                }
                            }
                        ])
                        break

                    default: // Caso por defecto (sin filtro)
                        sales = await Sale.countDocuments()
                        sellers = await Sale.aggregate([
                            {
                                $group: {
                                    _id: "$saler", // Agrupar por el nombre del vendedor
                                    totalSales: { $sum: "$total" }, // Sumar el total de las ventas
                                },
                            },
                            {
                                $sort: { totalSales: -1 }, // Ordenar por total de ventas en orden descendente
                            },
                            {
                                $limit: 4, // Limitar a los 4 mejores vendedores
                            },
                            {
                                $project: {
                                    _id: 0, // Excluir el campo '_id' del resultado final
                                    saler: "$_id", // Renombrar el campo '_id' a 'saler' para representar el nombre del vendedor
                                    totalSales: 1, // Incluir el total de ventas
                                },
                            },
                        ]);
                        break
                }

                if (totalAmount.length > 0) {
                    data.val2 = totalAmount[0].total
                } else {
                    data.val2 = 0
                }

                data.val1 = sales

                data.xsData = sellers
                data.data = lastMovements

            }

        } else {
            if (initDate !== '' && endDate !== '') {

                let startDate, endedDate
                startDate = new Date(initDate)
                endedDate = new Date(endDate)

                startDate.setUTCHours(0, 0, 0, 0);

                endedDate.setUTCHours(23, 59, 59, 0);

                let exits = 0
                let entries = 0

                let lastMovements

                lastMovements = await Inventory.aggregate([
                    {
                        $match: {
                            createdAt: { $gte: startDate, $lt: endedDate }
                        }
                    },
                    { $sort: { createdAt: -1 } }, // Ordenar por fecha de creación, descendente
                    { $limit: 15 }, // Limitar a las últimas 15 ventas
                    {
                        $project: {
                            _id: 1,
                            user: "$user",
                            info: "$name",
                            value: "$amount"
                        }
                    }
                ])

                const sales = await Sale.find({
                    createdAt: { $gte: startDate, $lt: endedDate },
                    status: 'Completa',
                }).select('total cart saler createdAt')

                const productSalesCount = []

                sales.forEach(sale => {
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

                exits = await Inventory.countDocuments({ method: 'Salida', createdAt: { $gte: startDate, $lt: endedDate } })
                entries = await Inventory.countDocuments({ method: 'Entrada', createdAt: { $gte: startDate, $lt: endedDate } })

                const sortedProducts = productSalesCount.sort((a, b) => b.quantity - a.quantity)

                const top5Products = sortedProducts.slice(0, 4)

                data.val1 = exits
                data.val2 = entries
                data.data = lastMovements
                data.xsData = top5Products


            } else {
                let exits = 0
                let entries = 0

                let sales
                let sortedProducts
                let lastMovements

                const today = new Date()

                today.setUTCHours(today.getUTCHours() - 5)

                let startDate, endDate

                let top5Products
                let latestEntriesExits
                const productSalesCount = []

                switch (type) {
                    case 1:
                        startDate = new Date(today.getFullYear(), today.getMonth(), today.getDate())
                        startDate.setUTCHours(0, 0, 0, 0)

                        endDate = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1)
                        endDate.setUTCHours(23, 59, 59, 0)

                        lastMovements = await Inventory.aggregate([
                            {
                                $match: {
                                    createdAt: { $gte: startDate, $lt: endDate }
                                }
                            },
                            { $sort: { createdAt: -1 } }, // Ordenar por fecha de creación, descendente
                            { $limit: 15 }, // Limitar a las últimas 15 ventas
                            {
                                $project: {
                                    _id: 1,
                                    user: "$user",
                                    info: "$name",
                                    value: "$amount"
                                }
                            }
                        ])

                        sales = await Sale.find({
                            createdAt: {
                                $gte: startDate,
                                $lte: endDate,
                            },
                            status: 'Completa',
                        }).select('total cart saler createdAt')


                        sales.forEach(sale => {
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

                        exits = await Inventory.countDocuments({ method: 'Salida', createdAt: { $gte: startDate, $lt: endDate } })
                        entries = await Inventory.countDocuments({ method: 'Entrada', createdAt: { $gte: startDate, $lt: endDate } })

                        sortedProducts = productSalesCount.sort((a, b) => b.quantity - a.quantity)
                        top5Products = sortedProducts.slice(0, 4)
                        latestEntriesExits = lastMovements
                        break

                    case 2: // Ventas de esta semana
                        const dayOfWeek = today.getDay(); // 0 (Sunday) to 6 (Saturday)

                        // Calculate start of the week (Monday at 00:00:00 UTC)
                        const startOfWeek = new Date(today);
                        startOfWeek.setDate(today.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1)); // Move to Monday
                        startOfWeek.setUTCHours(0, 0, 0, 0); // Set time to 00:00:00 UTC

                        // Calculate end of the week (Sunday at 23:59:59 UTC)
                        const endOfWeek = new Date(startOfWeek);
                        endOfWeek.setDate(startOfWeek.getDate() + 6); // Move to Sunday
                        endOfWeek.setUTCHours(23, 59, 59, 999); // Set time to 23:59:59.999 UTC

                        lastMovements = await Inventory.aggregate([
                            {
                                $match: {
                                    createdAt: { $gte: startOfWeek, $lt: endOfWeek }
                                }
                            },
                            { $sort: { createdAt: -1 } }, // Ordenar por fecha de creación, descendente
                            { $limit: 15 }, // Limitar a las últimas 15 ventas
                            {
                                $project: {
                                    _id: 1,
                                    user: "$user",
                                    info: "$name",
                                    value: "$amount"
                                }
                            }
                        ])

                        sales = await Sale.find({
                            createdAt: { $gte: startOfWeek, $lt: endOfWeek },
                            status: 'Completa',
                        }).select('total cart saler createdAt')


                        sales.forEach(sale => {
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

                        exits = await Inventory.countDocuments({ method: 'Salida', createdAt: { $gte: startOfWeek, $lt: endOfWeek } })
                        entries = await Inventory.countDocuments({ method: 'Entrada', createdAt: { $gte: startOfWeek, $lt: endOfWeek } })

                        sortedProducts = productSalesCount.sort((a, b) => b.quantity - a.quantity)
                        top5Products = sortedProducts.slice(0, 4)
                        latestEntriesExits = lastMovements
                        break

                    case 3: // Ventas de este mes
                        startDate = new Date(today.getFullYear(), today.getMonth(), 1) // Inicio del mes
                        startDate.setUTCHours(0, 0, 0, 0)

                        endDate = new Date(today.getFullYear(), today.getMonth() + 1, 1) // Inicio del próximo mes
                        endDate.setUTCHours(23, 59, 59, 0)

                        lastMovements = await Inventory.aggregate([
                            {
                                $match: {
                                    createdAt: { $gte: startDate, $lt: endDate }
                                }
                            },
                            { $sort: { createdAt: -1 } }, // Ordenar por fecha de creación, descendente
                            { $limit: 15 }, // Limitar a las últimas 15 ventas
                            {
                                $project: {
                                    _id: 1,
                                    user: "$user",
                                    info: "$name",
                                    value: "$amount"
                                }
                            }
                        ])
                        sales = await Sale.find({
                            createdAt: { $gte: startDate, $lt: endDate },
                            status: 'Completa',
                        }).select('total cart saler createdAt')


                        sales.forEach(sale => {
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

                        exits = await Inventory.countDocuments({ method: 'Salida', createdAt: { $gte: startDate, $lt: endDate } })
                        entries = await Inventory.countDocuments({ method: 'Entrada', createdAt: { $gte: startDate, $lt: endDate } })

                        sortedProducts = productSalesCount.sort((a, b) => b.quantity - a.quantity)
                        top5Products = sortedProducts.slice(0, 4)
                        latestEntriesExits = lastMovements
                        break

                    case 4: // Ventas de este año
                        startDate = new Date(today.getFullYear(), 0, 1) // Inicio del año
                        startDate.setUTCHours(startDate.getUTCHours() - 5)

                        endDate = new Date(today.getFullYear() + 1, 0, 1) // Inicio del próximo año
                        endDate.setUTCHours(endDate.getUTCHours() - 5)

                        lastMovements = await Inventory.aggregate([
                            {
                                $match: {
                                    createdAt: { $gte: startDate, $lt: endDate }
                                }
                            },
                            { $sort: { createdAt: -1 } }, // Ordenar por fecha de creación, descendente
                            { $limit: 15 }, // Limitar a las últimas 15 ventas
                            {
                                $project: {
                                    _id: 1,
                                    user: "$user",
                                    info: "$name",
                                    value: "$amount"
                                }
                            }
                        ])
                        sales = await Sale.find({
                            createdAt: { $gte: startDate, $lt: endDate },
                            status: 'Completa',
                        }).select('total cart saler createdAt')


                        sales.forEach(sale => {
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

                        exits = await Inventory.countDocuments({ method: 'Salida', createdAt: { $gte: startDate, $lt: endDate } })
                        entries = await Inventory.countDocuments({ method: 'Entrada', createdAt: { $gte: startDate, $lt: endDate } })

                        sortedProducts = productSalesCount.sort((a, b) => b.quantity - a.quantity)
                        top5Products = sortedProducts.slice(0, 4)
                        latestEntriesExits = lastMovements
                        break

                    default: // Caso por defecto (sin filtro)
                        break
                }

                data.val1 = exits
                data.val2 = entries
                data.data = latestEntriesExits
                data.xsData = top5Products

            }
        }


        return NextResponse.json(
            {
                data
            }, {
            status: 200
        }
        )

    } catch (e) {
        return NextResponse.json({
            msg: 'Somethign when wrong: ' + e
        }, {
            status: 500,
        })
    }
}