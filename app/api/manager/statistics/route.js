import connectMongoDB from "@libs/mongodb"
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

                const initDateObj = new Date(initDate)
                const endDateObj = new Date(endDate)
                let sales
                let totalAmount
                let sellers

                let lastMovements

                lastMovements = await Sale.aggregate([
                    {
                        $match: {
                            createdAt: { $gte: new Date(initDate), $lt: new Date(endDate) }
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
                sales = await Sale.countDocuments({ createdAt: { $gte: initDateObj, $lt: endDateObj } })
                totalAmount = await Sale.aggregate([
                    { $match: { createdAt: { $gte: initDateObj, $lt: endDateObj } } },
                    { $group: { _id: null, total: { $sum: "$total" } } },
                ])
                sellers = await Sale.aggregate([
                    {
                        $match: {
                            createdAt: { $gte: initDateObj, $lt: endDateObj },
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

                        break

                    case 2: // Ventas de esta semana
                        const dayOfWeek = today.getDay(); // 0 (Domingo) a 6 (Sábado)
                        const startOfWeek = new Date(today); // Copia de la fecha actual
                        startOfWeek.setDate(today.getDate() - dayOfWeek); // Ajusta al primer día de la semana
                        startOfWeek.setUTCHours(0, 0, 0, 0); // Establece la hora a las 00:00 en UTC

                        const endOfWeek = new Date(startOfWeek); // Copia del inicio de la semana
                        endOfWeek.setDate(startOfWeek.getDate() + 7); // Ajusta al primer día de la siguiente semana
                        endOfWeek.setUTCHours(0, 0, 0, 0); // Establece la hora a las 00:00 en UTC

                        // Resta 5 horas para ajustarlo al horario de Ecuador (UTC-5)
                        startOfWeek.setUTCHours(startOfWeek.getUTCHours() - 5);
                        endOfWeek.setUTCHours(endOfWeek.getUTCHours() - 5);

                        sales = await Sale.countDocuments({ createdAt: { $gte: startOfWeek, $lt: endOfWeek } });
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
                console.log(lastMovements)


            }

        } else {
            if (initDate !== '' && endDate !== '') {

                const initDateObj = new Date(initDate)
                const endDateObj = new Date(endDate)

                let exits = 0
                let entries = 0

                const products = await Product.find().select('inventory name user stock')

                const today = new Date()

                today.setUTCHours(today.getUTCHours() - 5)

                const latestEntriesExits = []

                for (const product of products) {
                    if (!product.inventory || product.inventory.length === 0) {
                        console.log('Inventario vacío, se ignora este producto:', product.name || "Sin nombre");
                        continue;
                    }

                    // Filtrar registros dentro del rango de fechas
                    const todayRecords = product.inventory.filter(record => {
                        if (!record.date) return false; // Ignorar registros sin fecha
                        const recordDate = new Date(record.date);
                        return recordDate >= initDateObj && recordDate <= endDateObj; // Rango de fechas
                    });

                    // Contar entradas y salidas
                    entries += todayRecords.filter(record => record.method === 'Entrada').length;
                    exits += todayRecords.filter(record => record.method === 'Salida').length;

                    // Ordenar y tomar los 15 registros más recientes
                    const recentRecords = todayRecords
                        .sort((a, b) => new Date(b.date) - new Date(a.date)) // Ordenar por fecha descendente
                        .slice(0, 15)

                    // Agregar registros recientes a `latestEntriesExits`
                    recentRecords.forEach(record => {
                        if (record.date && record.amount !== undefined && record.method) {
                            latestEntriesExits.push({
                                user: product.name || "Unknown", // Nombre del producto
                                value: record.amount, // Cantidad del registro
                                info: record.method, // Método (Entrada/Salida)
                                date: record.date, // Fecha del registro
                            });
                        } else {
                            console.warn("Registro inválido encontrado:", record);
                        }
                    });
                }

                latestEntriesExits.sort((a, b) => new Date(b.date) - new Date(a.date))

                const sales = await Sale.find({
                    createdAt: {
                        $gte: initDateObj,
                        $lte: endDateObj,
                    },
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

                const sortedProducts = productSalesCount.sort((a, b) => b.quantity - a.quantity)

                const top5Products = sortedProducts.slice(0, 4)
                data.val1 = exits
                data.val2 = entries
                data.data = latestEntriesExits.slice(0,15)
                data.xsData = top5Products


            } else {
                let exits = 0
                let entries = 0

                let sales
                let sortedProducts

                const products = await Product.find().select('inventory name user stock')

                const today = new Date()

                today.setUTCHours(today.getUTCHours() - 5)

                let startDate, endDate

                let top5Products
                const latestEntriesExits = []
                const productSalesCount = []

                switch (type) {
                    case 1:
                        startDate = new Date(today.getFullYear(), today.getMonth(), today.getDate())
                        startDate.setUTCHours(startDate.getUTCHours() - 5)

                        endDate = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1)
                        endDate.setUTCHours(endDate.getUTCHours() - 5)

                        for (const product of products) {

                            if (!product.inventory || product.inventory.length === 0) {
                                console.log('Inventario vacío, se ignora este producto');
                            }
                            // Filtrar los registros dentro del rango de fechas
                            const filteredRecords = product.inventory.filter(record => {
                                if (!record.date) return false; // Ignorar registros sin fecha
                                const recordDate = new Date(record.date);
                                return recordDate >= startDate && recordDate < endDate; // Dentro del rango
                            });

                            // Contar entradas y salidas de los registros filtrados
                            entries += filteredRecords.filter(record => record.method === 'Entrada').length;
                            exits += filteredRecords.filter(record => record.method === 'Salida').length;

                            // Ordenar por fecha descendente y tomar los 15 registros más recientes dentro del rango
                            const recentRecords = filteredRecords
                                .sort((a, b) => new Date(b.date) - new Date(a.date)) // Ordenar por fecha descendente
                                .slice(0, 15); // Tomar los 15 registros más recientes

                            // Agregar registros procesados a latestEntriesExits
                            recentRecords.forEach(record => {
                                if (record.date && record.amount !== undefined && record.method) {
                                    latestEntriesExits.push({
                                        user: product.name || "Unknown", // Nombre del producto
                                        value: record.amount, // Cantidad del registro
                                        info: record.method, // Método (Entrada/Salida)
                                        date: record.date, // Fecha del registro
                                    });
                                } else {
                                    console.warn("Registro inválido encontrado:", record);
                                }
                            })
                        }


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

                        sortedProducts = productSalesCount.sort((a, b) => b.quantity - a.quantity)
                        top5Products = sortedProducts.slice(0, 4)

                        break

                    case 2: // Ventas de esta semana
                        const dayOfWeek = today.getDay(); // 0 (Domingo) a 6 (Sábado)
                        const startOfWeek = new Date(today); // Copia de la fecha actual
                        startOfWeek.setDate(today.getDate() - dayOfWeek); // Ajusta al primer día de la semana
                        startOfWeek.setUTCHours(0, 0, 0, 0); // Establece la hora a las 00:00 en UTC

                        const endOfWeek = new Date(startOfWeek); // Copia del inicio de la semana
                        endOfWeek.setDate(startOfWeek.getDate() + 7); // Ajusta al primer día de la siguiente semana
                        endOfWeek.setUTCHours(0, 0, 0, 0); // Establece la hora a las 00:00 en UTC

                        // Resta 5 horas para ajustarlo al horario de Ecuador (UTC-5)
                        startOfWeek.setUTCHours(startOfWeek.getUTCHours() - 5);
                        endOfWeek.setUTCHours(endOfWeek.getUTCHours() - 5);

                        for (const product of products) {
                            if (!product.inventory || product.inventory.length === 0) {
                                console.log('Inventario vacío, se ignora este producto');
                            } // Filtrar los registros dentro del rango de fechas
                            const filteredRecords = product.inventory.filter(record => {
                                if (!record.date) return false; // Ignorar registros sin fecha
                                const recordDate = new Date(record.date);
                                return recordDate >= startOfWeek && recordDate < endOfWeek; // Dentro del rango
                            });

                            // Contar entradas y salidas de los registros filtrados
                            entries += filteredRecords.filter(record => record.method === 'Entrada').length;
                            exits += filteredRecords.filter(record => record.method === 'Salida').length;

                            // Ordenar por fecha descendente y tomar los 15 registros más recientes dentro del rango
                            const recentRecords = filteredRecords
                                .sort((a, b) => new Date(b.date) - new Date(a.date)) // Ordenar por fecha descendente
                                .slice(0, 15); // Tomar los 15 registros más recientes

                            // Agregar registros procesados a latestEntriesExits
                            recentRecords.forEach(record => {
                                if (record.date && record.amount !== undefined && record.method) {
                                    latestEntriesExits.push({
                                        user: product.name || "Unknown", // Nombre del producto
                                        value: record.amount, // Cantidad del registro
                                        info: record.method, // Método (Entrada/Salida)
                                        date: record.date, // Fecha del registro
                                    });
                                } else {
                                    console.warn("Registro inválido encontrado:", record);
                                }
                            });
                        }
                        sales = await Sale.find({
                            createdAt: {
                                $gte: startOfWeek,
                                $lte: endOfWeek,
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

                        sortedProducts = productSalesCount.sort((a, b) => b.quantity - a.quantity)

                        top5Products = sortedProducts.slice(0, 4)
                        break

                    case 3: // Ventas de este mes
                        startDate = new Date(today.getFullYear(), today.getMonth(), 1) // Inicio del mes
                        startDate.setUTCHours(startDate.getUTCHours() - 5)

                        endDate = new Date(today.getFullYear(), today.getMonth() + 1, 1) // Inicio del próximo mes
                        endDate.setUTCHours(endDate.getUTCHours() - 5)

                        for (const product of products) {
                            if (!product.inventory || product.inventory.length === 0) {
                                console.log('Inventario vacío, se ignora este producto');
                            }
                            // Filtrar los registros dentro del rango de fechas
                            const filteredRecords = product.inventory.filter(record => {
                                if (!record.date) return false; // Ignorar registros sin fecha
                                const recordDate = new Date(record.date);
                                return recordDate >= startDate && recordDate < endDate; // Dentro del rango
                            });

                            // Contar entradas y salidas de los registros filtrados
                            entries += filteredRecords.filter(record => record.method === 'Entrada').length;
                            exits += filteredRecords.filter(record => record.method === 'Salida').length;

                            // Ordenar por fecha descendente y tomar los 15 registros más recientes dentro del rango
                            const recentRecords = filteredRecords
                                .sort((a, b) => new Date(b.date) - new Date(a.date)) // Ordenar por fecha descendente
                                .slice(0, 15); // Tomar los 15 registros más recientes

                            // Agregar registros procesados a latestEntriesExits
                            recentRecords.forEach(record => {
                                if (record.date && record.amount !== undefined && record.method) {
                                    latestEntriesExits.push({
                                        user: product.name || "Unknown", // Nombre del producto
                                        value: record.amount, // Cantidad del registro
                                        info: record.method, // Método (Entrada/Salida)
                                        date: record.date, // Fecha del registro
                                    });
                                } else {
                                    console.warn("Registro inválido encontrado:", record);
                                }
                            })
                        }
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

                        sortedProducts = productSalesCount.sort((a, b) => b.quantity - a.quantity)

                        top5Products = sortedProducts.slice(0, 4)
                        break

                    case 4: // Ventas de este año
                        startDate = new Date(today.getFullYear(), 0, 1) // Inicio del año
                        startDate.setUTCHours(startDate.getUTCHours() - 5)

                        endDate = new Date(today.getFullYear() + 1, 0, 1) // Inicio del próximo año
                        endDate.setUTCHours(endDate.getUTCHours() - 5)

                        for (const product of products) {
                            if (!product.inventory || product.inventory.length === 0) {
                                console.log('Inventario vacío, se ignora este producto');
                            }
                            // Filtrar los registros dentro del rango de fechas
                            const filteredRecords = product.inventory.filter(record => {
                                if (!record.date) return false; // Ignorar registros sin fecha
                                const recordDate = new Date(record.date);
                                return recordDate >= startDate && recordDate < endDate; // Dentro del rango
                            });

                            // Contar entradas y salidas de los registros filtrados
                            entries += filteredRecords.filter(record => record.method === 'Entrada').length;
                            exits += filteredRecords.filter(record => record.method === 'Salida').length;

                            // Ordenar por fecha descendente y tomar los 15 registros más recientes dentro del rango
                            const recentRecords = filteredRecords
                                .sort((a, b) => new Date(b.date) - new Date(a.date)) // Ordenar por fecha descendente
                                .slice(0, 15); // Tomar los 15 registros más recientes

                            // Agregar registros procesados a latestEntriesExits
                            recentRecords.forEach(record => {
                                if (record.date && record.amount !== undefined && record.method) {
                                    latestEntriesExits.push({
                                        user: product.name || "Unknown", // Nombre del producto
                                        value: record.amount, // Cantidad del registro
                                        info: record.method, // Método (Entrada/Salida)
                                        date: record.date, // Fecha del registro
                                    });
                                } else {
                                    console.warn("Registro inválido encontrado:", record);
                                }
                            })
                        }
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

                        sortedProducts = productSalesCount.sort((a, b) => b.quantity - a.quantity)

                        top5Products = sortedProducts.slice(0, 4)
                        break

                    default: // Caso por defecto (sin filtro)
                        break
                }

                latestEntriesExits.sort((a, b) => new Date(b.date) - new Date(a.date))

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