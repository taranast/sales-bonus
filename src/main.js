/**
 * Функция для расчета выручки
 * @param purchase запись о покупке
 * @param _product карточка товара
 * @returns {number}
 */
function calculateSimpleRevenue(purchase, _product) {
   const discount =  1 - (purchase.discount / 100);
   return purchase.sale_price*purchase.quantity*discount;
}

/**
 * Функция для расчета бонусов
 * @param index порядковый номер в отсортированном массиве
 * @param total общее число продавцов
 * @param seller карточка продавца
 * @returns {number}
 */
function calculateBonusByProfit(index, total, seller) {
    if (index === 0) {
        return 0.15*seller.profit;
    } else if (index === 1 || index === 2) {
        return 0.1*seller.profit;
    } else if (index === total-1) {
        return 0;
    } else {
        return 0.05*seller.profit;
    }
}

/**
 * Функция для анализа данных продаж
 * @param data
 * @param options
 * @returns {{revenue, top_products, bonus, name, sales_count, profit, seller_id}[]}
 */
function analyzeSalesData(data, options) {
    if (!data
        || !Array.isArray(data.sellers)
        || !Array.isArray(data.products) 
        || !Array.isArray(data.purchase_records)
        || data.sellers.length === 0 
        || data.products.length === 0 
        || data.purchase_records.length === 0
        ) {
            throw new Error('Некорректные входные данные');
        }

    const { calculateRevenue, calculateBonus } = options;
    if (!calculateRevenue 
        || !calculateBonus 
        || typeof calculateRevenue !== "function" 
        || typeof calculateBonus !== "function"
        ) {
            throw new Error('Чего-то не хватает');
        }
    
    const sellerStats = data.sellers.map(seller => ({
        id: seller.id,
        name: `${seller.first_name} ${seller.last_name}`,
        revenue: 0,
        profit: 0,
        sales_count: 0,
        products_sold: {}
    }));

    const sellerIndex = Object.fromEntries(sellerStats.map(seller => [seller.id, seller]));
    const productIndex = Object.fromEntries(data.products.map(product => [product.sku, product]));

    data.purchase_records.forEach(record => {
        const seller = sellerIndex[record.seller_id];
        ++seller.sales_count;
        seller.revenue+=record.total_amount;

        record.items.forEach(item => {
            const product = productIndex[item.sku];
            const cost = product.purchase_price*item.quantity;
            const revenue = calculateRevenue(item);
            const profit = revenue - cost;  
            seller.profit+=profit;

            if (!seller.products_sold[item.sku]) {
                seller.products_sold[item.sku] = 0;
            }
            seller.products_sold[item.sku] += item.quantity;
        });
    });

    sellerStats.sort((firstSeller, secondSeller) => {
        return secondSeller.profit - firstSeller.profit;
    });
    // @TODO: Назначение премий на основе ранжирования
    sellerStats.forEach((seller, index) => {
        seller.bonus = calculateBonus(index, sellerStats.length, seller);
    });
    // @TODO: Подготовка итоговой коллекции с нужными полями
}
