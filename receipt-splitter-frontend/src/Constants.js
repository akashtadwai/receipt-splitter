module.exports = Object.freeze({
    'MOCK_OCR_OUTPUT' : {
        "file_name": "instamart_order",
        "topics": ["Instamart Order", "Grocery Delivery"],
        "languages": ["English"],
        "ocr_contents": {
            "items": [
                { "name": "Coriander Leaves (Kothimbir)", "price": 17.0 },
                { "name": "Nandini GoodLife Toned Milk", "price": 146.0 },
                { "name": "Epigamia Greek Yogurt - Raspberry", "price": 60.0 },
                { "name": "Beetroot", "price": 18.0 },
                { "name": "Carrot (Gajar)", "price": 28.0 },
                { "name": "Curry Leaves (Kadi Patta)", "price": 9.0 }
            ],
            "total_order_bill_details": {
                "total_bill": 289.0,
                "taxes": [
                    { "name": "Handling Fee", "amount": 10.5 }
                ]
            }
        }
    }
});