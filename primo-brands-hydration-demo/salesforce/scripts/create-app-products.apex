// Create Product2 records for all app products
// Run: sf apex run -f salesforce/scripts/create-app-products.apex -o my-org
//
// This script:
// 1. Creates 110 Product2 records matching the app's product catalog
// 2. Uses ProductCode to store the app's slug ID for reverse mapping
// 3. Uses Family to store the brand
// 4. Outputs JSON mapping of { productCode: salesforceId } for app integration

System.debug('=== CREATING APP PRODUCTS IN SALESFORCE ===');

// Check for existing products to avoid duplicates
Set<String> existingCodes = new Set<String>();
for (Product2 p : [SELECT ProductCode FROM Product2 WHERE ProductCode != null]) {
    existingCodes.add(p.ProductCode);
}
System.debug('Found ' + existingCodes.size() + ' existing products with ProductCode');

List<Product2> productsToInsert = new List<Product2>();

// Helper to add product if not exists
// Using a simple approach since we can't define methods in anonymous apex easily

// ═══════════════════════════════════════════════════════════════════
// SERENE (Skincare) - 29 Products
// ═══════════════════════════════════════════════════════════════════

if (!existingCodes.contains('moisturizer-sensitive')) {
    productsToInsert.add(new Product2(Name = 'Hydra-Calm Sensitive Moisturizer', ProductCode = 'moisturizer-sensitive', Family = 'SERENE', IsActive = true));
}
if (!existingCodes.contains('sunscreen-lightweight')) {
    productsToInsert.add(new Product2(Name = 'Invisible Shield SPF 50', ProductCode = 'sunscreen-lightweight', Family = 'SERENE', IsActive = true));
}
if (!existingCodes.contains('mist-refreshing')) {
    productsToInsert.add(new Product2(Name = 'Cooling Facial Mist', ProductCode = 'mist-refreshing', Family = 'SERENE', IsActive = true));
}
if (!existingCodes.contains('blotting-sheets')) {
    productsToInsert.add(new Product2(Name = 'Oil Control Blotting Papers', ProductCode = 'blotting-sheets', Family = 'SERENE', IsActive = true));
}
if (!existingCodes.contains('cleanser-gentle')) {
    productsToInsert.add(new Product2(Name = 'Cloud Cream Cleanser', ProductCode = 'cleanser-gentle', Family = 'SERENE', IsActive = true));
}
if (!existingCodes.contains('mask-hydrating')) {
    productsToInsert.add(new Product2(Name = 'Deep Dew Hydrating Mask', ProductCode = 'mask-hydrating', Family = 'SERENE', IsActive = true));
}
if (!existingCodes.contains('toner-aha')) {
    productsToInsert.add(new Product2(Name = 'Glow Tonic AHA Toner', ProductCode = 'toner-aha', Family = 'SERENE', IsActive = true));
}
if (!existingCodes.contains('eye-cream')) {
    productsToInsert.add(new Product2(Name = 'Bright Eyes Caffeine Cream', ProductCode = 'eye-cream', Family = 'SERENE', IsActive = true));
}
if (!existingCodes.contains('moisturizer-oil-free')) {
    productsToInsert.add(new Product2(Name = 'Oil-Free Hydra Gel', ProductCode = 'moisturizer-oil-free', Family = 'SERENE', IsActive = true));
}
if (!existingCodes.contains('moisturizer-rich')) {
    productsToInsert.add(new Product2(Name = 'Ultra Rich Barrier Cream', ProductCode = 'moisturizer-rich', Family = 'SERENE', IsActive = true));
}
if (!existingCodes.contains('moisturizer-spf')) {
    productsToInsert.add(new Product2(Name = 'Daily Defense Moisturizer SPF 30', ProductCode = 'moisturizer-spf', Family = 'SERENE', IsActive = true));
}
if (!existingCodes.contains('moisturizer-night')) {
    productsToInsert.add(new Product2(Name = 'Overnight Recovery Cream', ProductCode = 'moisturizer-night', Family = 'SERENE', IsActive = true));
}
if (!existingCodes.contains('cleanser-micellar')) {
    productsToInsert.add(new Product2(Name = 'Micellar Cleansing Water', ProductCode = 'cleanser-micellar', Family = 'SERENE', IsActive = true));
}
if (!existingCodes.contains('cleanser-oil')) {
    productsToInsert.add(new Product2(Name = 'Pure Cleansing Oil', ProductCode = 'cleanser-oil', Family = 'SERENE', IsActive = true));
}
if (!existingCodes.contains('cleanser-foam')) {
    productsToInsert.add(new Product2(Name = 'Gentle Foaming Cleanser', ProductCode = 'cleanser-foam', Family = 'SERENE', IsActive = true));
}
if (!existingCodes.contains('cleanser-exfoliating')) {
    productsToInsert.add(new Product2(Name = 'Daily Micro-Exfoliating Cleanser', ProductCode = 'cleanser-exfoliating', Family = 'SERENE', IsActive = true));
}
if (!existingCodes.contains('sunscreen-tinted')) {
    productsToInsert.add(new Product2(Name = 'Tinted Glow Screen SPF 45', ProductCode = 'sunscreen-tinted', Family = 'SERENE', IsActive = true));
}
if (!existingCodes.contains('sunscreen-stick')) {
    productsToInsert.add(new Product2(Name = 'On-the-Go Sun Stick SPF 50', ProductCode = 'sunscreen-stick', Family = 'SERENE', IsActive = true));
}
if (!existingCodes.contains('sunscreen-body')) {
    productsToInsert.add(new Product2(Name = 'Body Shield Sunscreen SPF 50', ProductCode = 'sunscreen-body', Family = 'SERENE', IsActive = true));
}
if (!existingCodes.contains('toner-hydrating')) {
    productsToInsert.add(new Product2(Name = 'Essence Hydrating Toner', ProductCode = 'toner-hydrating', Family = 'SERENE', IsActive = true));
}
if (!existingCodes.contains('toner-calming')) {
    productsToInsert.add(new Product2(Name = 'Centella Calming Toner', ProductCode = 'toner-calming', Family = 'SERENE', IsActive = true));
}
if (!existingCodes.contains('mask-clay')) {
    productsToInsert.add(new Product2(Name = 'Pore Purifying Clay Mask', ProductCode = 'mask-clay', Family = 'SERENE', IsActive = true));
}
if (!existingCodes.contains('mask-sheet-hydrating')) {
    productsToInsert.add(new Product2(Name = 'Hydra-Boost Sheet Mask (5-Pack)', ProductCode = 'mask-sheet-hydrating', Family = 'SERENE', IsActive = true));
}
if (!existingCodes.contains('mask-exfoliating')) {
    productsToInsert.add(new Product2(Name = 'Enzyme Renewal Mask', ProductCode = 'mask-exfoliating', Family = 'SERENE', IsActive = true));
}
if (!existingCodes.contains('eye-cream-brightening')) {
    productsToInsert.add(new Product2(Name = 'Vitamin C Eye Brightener', ProductCode = 'eye-cream-brightening', Family = 'SERENE', IsActive = true));
}
if (!existingCodes.contains('eye-cream-firming')) {
    productsToInsert.add(new Product2(Name = 'Peptide Lift Eye Cream', ProductCode = 'eye-cream-firming', Family = 'SERENE', IsActive = true));
}
if (!existingCodes.contains('travel-kit-essentials')) {
    productsToInsert.add(new Product2(Name = 'Travel Essentials Kit', ProductCode = 'travel-kit-essentials', Family = 'SERENE', IsActive = true));
}
if (!existingCodes.contains('travel-kit-hydration')) {
    productsToInsert.add(new Product2(Name = 'Hydration Hero Travel Set', ProductCode = 'travel-kit-hydration', Family = 'SERENE', IsActive = true));
}
if (!existingCodes.contains('lip-balm-spf')) {
    productsToInsert.add(new Product2(Name = 'Protective Lip Balm SPF 25', ProductCode = 'lip-balm-spf', Family = 'SERENE', IsActive = true));
}

// ═══════════════════════════════════════════════════════════════════
// LUMIERE (Serums + Makeup) - 42 Products
// ═══════════════════════════════════════════════════════════════════

if (!existingCodes.contains('serum-vitamin-c')) {
    productsToInsert.add(new Product2(Name = 'Glow Boost Vitamin C Serum', ProductCode = 'serum-vitamin-c', Family = 'LUMIERE', IsActive = true));
}
if (!existingCodes.contains('serum-retinol')) {
    productsToInsert.add(new Product2(Name = 'Midnight Renewal Retinol Serum', ProductCode = 'serum-retinol', Family = 'LUMIERE', IsActive = true));
}
if (!existingCodes.contains('serum-anti-aging')) {
    productsToInsert.add(new Product2(Name = 'Peptide Lift Pro Serum', ProductCode = 'serum-anti-aging', Family = 'LUMIERE', IsActive = true));
}
if (!existingCodes.contains('foundation-dewy')) {
    productsToInsert.add(new Product2(Name = 'Skin Glow Serum Foundation', ProductCode = 'foundation-dewy', Family = 'LUMIERE', IsActive = true));
}
if (!existingCodes.contains('lipstick-velvet')) {
    productsToInsert.add(new Product2(Name = 'Velvet Matte Lip Color', ProductCode = 'lipstick-velvet', Family = 'LUMIERE', IsActive = true));
}
if (!existingCodes.contains('mascara-volume')) {
    productsToInsert.add(new Product2(Name = 'Lash Drama Volume Mascara', ProductCode = 'mascara-volume', Family = 'LUMIERE', IsActive = true));
}
if (!existingCodes.contains('blush-silk')) {
    productsToInsert.add(new Product2(Name = 'Silk Petal Blush', ProductCode = 'blush-silk', Family = 'LUMIERE', IsActive = true));
}
if (!existingCodes.contains('serum-hyaluronic')) {
    productsToInsert.add(new Product2(Name = 'Pure Hyaluronic Acid Serum', ProductCode = 'serum-hyaluronic', Family = 'LUMIERE', IsActive = true));
}
if (!existingCodes.contains('serum-bakuchiol')) {
    productsToInsert.add(new Product2(Name = 'Gentle Retinol Alternative Serum', ProductCode = 'serum-bakuchiol', Family = 'LUMIERE', IsActive = true));
}
if (!existingCodes.contains('serum-brightening')) {
    productsToInsert.add(new Product2(Name = 'Dark Spot Correcting Serum', ProductCode = 'serum-brightening', Family = 'LUMIERE', IsActive = true));
}
if (!existingCodes.contains('serum-barrier')) {
    productsToInsert.add(new Product2(Name = 'Ceramide Barrier Repair Serum', ProductCode = 'serum-barrier', Family = 'LUMIERE', IsActive = true));
}
if (!existingCodes.contains('serum-glow')) {
    productsToInsert.add(new Product2(Name = 'Instant Glow Priming Serum', ProductCode = 'serum-glow', Family = 'LUMIERE', IsActive = true));
}
if (!existingCodes.contains('serum-acne')) {
    productsToInsert.add(new Product2(Name = 'Clarifying BHA Serum', ProductCode = 'serum-acne', Family = 'LUMIERE', IsActive = true));
}
if (!existingCodes.contains('foundation-matte')) {
    productsToInsert.add(new Product2(Name = 'Velvet Matte Foundation', ProductCode = 'foundation-matte', Family = 'LUMIERE', IsActive = true));
}
if (!existingCodes.contains('foundation-stick')) {
    productsToInsert.add(new Product2(Name = 'Cover & Go Stick Foundation', ProductCode = 'foundation-stick', Family = 'LUMIERE', IsActive = true));
}
if (!existingCodes.contains('concealer-brightening')) {
    productsToInsert.add(new Product2(Name = 'Brightening Under-Eye Concealer', ProductCode = 'concealer-brightening', Family = 'LUMIERE', IsActive = true));
}
if (!existingCodes.contains('concealer-full')) {
    productsToInsert.add(new Product2(Name = 'Full Coverage Concealer', ProductCode = 'concealer-full', Family = 'LUMIERE', IsActive = true));
}
if (!existingCodes.contains('lipstick-satin')) {
    productsToInsert.add(new Product2(Name = 'Silk Satin Lipstick', ProductCode = 'lipstick-satin', Family = 'LUMIERE', IsActive = true));
}
if (!existingCodes.contains('lipstick-liquid')) {
    productsToInsert.add(new Product2(Name = 'Liquid Lip Color', ProductCode = 'lipstick-liquid', Family = 'LUMIERE', IsActive = true));
}
if (!existingCodes.contains('lip-gloss')) {
    productsToInsert.add(new Product2(Name = 'High Shine Lip Gloss', ProductCode = 'lip-gloss', Family = 'LUMIERE', IsActive = true));
}
if (!existingCodes.contains('lip-liner')) {
    productsToInsert.add(new Product2(Name = 'Precision Lip Liner', ProductCode = 'lip-liner', Family = 'LUMIERE', IsActive = true));
}
if (!existingCodes.contains('mascara-lengthening')) {
    productsToInsert.add(new Product2(Name = 'Lash Extend Lengthening Mascara', ProductCode = 'mascara-lengthening', Family = 'LUMIERE', IsActive = true));
}
if (!existingCodes.contains('mascara-waterproof')) {
    productsToInsert.add(new Product2(Name = 'All-Day Waterproof Mascara', ProductCode = 'mascara-waterproof', Family = 'LUMIERE', IsActive = true));
}
if (!existingCodes.contains('mascara-tubing')) {
    productsToInsert.add(new Product2(Name = 'Easy-Off Tubing Mascara', ProductCode = 'mascara-tubing', Family = 'LUMIERE', IsActive = true));
}
if (!existingCodes.contains('blush-powder')) {
    productsToInsert.add(new Product2(Name = 'Soft Focus Powder Blush', ProductCode = 'blush-powder', Family = 'LUMIERE', IsActive = true));
}
if (!existingCodes.contains('blush-liquid')) {
    productsToInsert.add(new Product2(Name = 'Dewy Liquid Blush', ProductCode = 'blush-liquid', Family = 'LUMIERE', IsActive = true));
}
if (!existingCodes.contains('highlighter-cream')) {
    productsToInsert.add(new Product2(Name = 'Lit From Within Highlighter', ProductCode = 'highlighter-cream', Family = 'LUMIERE', IsActive = true));
}
if (!existingCodes.contains('bronzer-matte')) {
    productsToInsert.add(new Product2(Name = 'Sun-Kissed Matte Bronzer', ProductCode = 'bronzer-matte', Family = 'LUMIERE', IsActive = true));
}
if (!existingCodes.contains('setting-powder')) {
    productsToInsert.add(new Product2(Name = 'Invisible Set Finishing Powder', ProductCode = 'setting-powder', Family = 'LUMIERE', IsActive = true));
}
if (!existingCodes.contains('setting-spray')) {
    productsToInsert.add(new Product2(Name = 'All-Day Lock Setting Spray', ProductCode = 'setting-spray', Family = 'LUMIERE', IsActive = true));
}
if (!existingCodes.contains('primer-pore')) {
    productsToInsert.add(new Product2(Name = 'Pore Blur Primer', ProductCode = 'primer-pore', Family = 'LUMIERE', IsActive = true));
}
if (!existingCodes.contains('primer-hydrating')) {
    productsToInsert.add(new Product2(Name = 'Hydra Glow Primer', ProductCode = 'primer-hydrating', Family = 'LUMIERE', IsActive = true));
}
if (!existingCodes.contains('eyeshadow-palette-neutral')) {
    productsToInsert.add(new Product2(Name = 'Everyday Neutrals Eyeshadow Palette', ProductCode = 'eyeshadow-palette-neutral', Family = 'LUMIERE', IsActive = true));
}
if (!existingCodes.contains('eyeshadow-palette-warm')) {
    productsToInsert.add(new Product2(Name = 'Sunset Glow Eyeshadow Palette', ProductCode = 'eyeshadow-palette-warm', Family = 'LUMIERE', IsActive = true));
}
if (!existingCodes.contains('brow-pencil')) {
    productsToInsert.add(new Product2(Name = 'Micro Brow Pencil', ProductCode = 'brow-pencil', Family = 'LUMIERE', IsActive = true));
}
if (!existingCodes.contains('brow-gel')) {
    productsToInsert.add(new Product2(Name = 'Tinted Brow Gel', ProductCode = 'brow-gel', Family = 'LUMIERE', IsActive = true));
}

// ═══════════════════════════════════════════════════════════════════
// DERMAFIX (Clinical / Targeted) - 18 Products
// ═══════════════════════════════════════════════════════════════════

if (!existingCodes.contains('cleanser-acne')) {
    productsToInsert.add(new Product2(Name = 'Clear Start Salicylic Cleanser', ProductCode = 'cleanser-acne', Family = 'DERMAFIX', IsActive = true));
}
if (!existingCodes.contains('serum-niacinamide')) {
    productsToInsert.add(new Product2(Name = 'Pore Refine Niacinamide Serum', ProductCode = 'serum-niacinamide', Family = 'DERMAFIX', IsActive = true));
}
if (!existingCodes.contains('spot-treatment')) {
    productsToInsert.add(new Product2(Name = 'SOS Blemish Patch', ProductCode = 'spot-treatment', Family = 'DERMAFIX', IsActive = true));
}
if (!existingCodes.contains('sunscreen-mineral')) {
    productsToInsert.add(new Product2(Name = 'Barrier Shield Mineral SPF 40', ProductCode = 'sunscreen-mineral', Family = 'DERMAFIX', IsActive = true));
}
if (!existingCodes.contains('serum-azelaic')) {
    productsToInsert.add(new Product2(Name = 'Azelaic Acid 10% Serum', ProductCode = 'serum-azelaic', Family = 'DERMAFIX', IsActive = true));
}
if (!existingCodes.contains('serum-aha-bha')) {
    productsToInsert.add(new Product2(Name = 'AHA/BHA Exfoliating Serum', ProductCode = 'serum-aha-bha', Family = 'DERMAFIX', IsActive = true));
}
if (!existingCodes.contains('serum-zinc')) {
    productsToInsert.add(new Product2(Name = 'Oil Control Zinc Serum', ProductCode = 'serum-zinc', Family = 'DERMAFIX', IsActive = true));
}
if (!existingCodes.contains('treatment-retinoid')) {
    productsToInsert.add(new Product2(Name = 'Retinoid 0.3% Treatment', ProductCode = 'treatment-retinoid', Family = 'DERMAFIX', IsActive = true));
}
if (!existingCodes.contains('treatment-benzoyl')) {
    productsToInsert.add(new Product2(Name = 'Benzoyl Peroxide 2.5% Gel', ProductCode = 'treatment-benzoyl', Family = 'DERMAFIX', IsActive = true));
}
if (!existingCodes.contains('treatment-sulfur')) {
    productsToInsert.add(new Product2(Name = 'Sulfur Acne Drying Treatment', ProductCode = 'treatment-sulfur', Family = 'DERMAFIX', IsActive = true));
}
if (!existingCodes.contains('moisturizer-acne')) {
    productsToInsert.add(new Product2(Name = 'Acne-Safe Oil-Free Moisturizer', ProductCode = 'moisturizer-acne', Family = 'DERMAFIX', IsActive = true));
}
if (!existingCodes.contains('cleanser-benzoyl')) {
    productsToInsert.add(new Product2(Name = 'Benzoyl Peroxide Wash 4%', ProductCode = 'cleanser-benzoyl', Family = 'DERMAFIX', IsActive = true));
}
if (!existingCodes.contains('peel-glycolic')) {
    productsToInsert.add(new Product2(Name = 'Glycolic Acid 10% Peel Pads', ProductCode = 'peel-glycolic', Family = 'DERMAFIX', IsActive = true));
}
if (!existingCodes.contains('mask-charcoal')) {
    productsToInsert.add(new Product2(Name = 'Activated Charcoal Detox Mask', ProductCode = 'mask-charcoal', Family = 'DERMAFIX', IsActive = true));
}
if (!existingCodes.contains('sunscreen-acne')) {
    productsToInsert.add(new Product2(Name = 'Clear Skin SPF 50 Fluid', ProductCode = 'sunscreen-acne', Family = 'DERMAFIX', IsActive = true));
}
if (!existingCodes.contains('treatment-rosacea')) {
    productsToInsert.add(new Product2(Name = 'Redness Relief Serum', ProductCode = 'treatment-rosacea', Family = 'DERMAFIX', IsActive = true));
}
if (!existingCodes.contains('treatment-scar')) {
    productsToInsert.add(new Product2(Name = 'Scar Fading Gel', ProductCode = 'treatment-scar', Family = 'DERMAFIX', IsActive = true));
}

// ═══════════════════════════════════════════════════════════════════
// MAISON (Fragrance + Hair Care) - 21 Products
// ═══════════════════════════════════════════════════════════════════

if (!existingCodes.contains('fragrance-floral')) {
    productsToInsert.add(new Product2(Name = 'Jardin de Nuit Eau de Parfum', ProductCode = 'fragrance-floral', Family = 'MAISON', IsActive = true));
}
if (!existingCodes.contains('fragrance-woody')) {
    productsToInsert.add(new Product2(Name = 'Bois Sauvage Eau de Toilette', ProductCode = 'fragrance-woody', Family = 'MAISON', IsActive = true));
}
if (!existingCodes.contains('shampoo-repair')) {
    productsToInsert.add(new Product2(Name = 'Bond Repair Shampoo', ProductCode = 'shampoo-repair', Family = 'MAISON', IsActive = true));
}
if (!existingCodes.contains('conditioner-hydrating')) {
    productsToInsert.add(new Product2(Name = 'Silk Hydration Conditioner', ProductCode = 'conditioner-hydrating', Family = 'MAISON', IsActive = true));
}
if (!existingCodes.contains('fragrance-fresh')) {
    productsToInsert.add(new Product2(Name = 'Mer Bleue Eau de Toilette', ProductCode = 'fragrance-fresh', Family = 'MAISON', IsActive = true));
}
if (!existingCodes.contains('fragrance-oriental')) {
    productsToInsert.add(new Product2(Name = 'Velvet Oud Eau de Parfum', ProductCode = 'fragrance-oriental', Family = 'MAISON', IsActive = true));
}
if (!existingCodes.contains('fragrance-citrus')) {
    productsToInsert.add(new Product2(Name = 'Citrus Garden Cologne', ProductCode = 'fragrance-citrus', Family = 'MAISON', IsActive = true));
}
if (!existingCodes.contains('fragrance-travel')) {
    productsToInsert.add(new Product2(Name = 'Discovery Set (4 x 10ml)', ProductCode = 'fragrance-travel', Family = 'MAISON', IsActive = true));
}
if (!existingCodes.contains('fragrance-solid')) {
    productsToInsert.add(new Product2(Name = 'Solid Perfume Compact', ProductCode = 'fragrance-solid', Family = 'MAISON', IsActive = true));
}
if (!existingCodes.contains('shampoo-volumizing')) {
    productsToInsert.add(new Product2(Name = 'Root Lift Volumizing Shampoo', ProductCode = 'shampoo-volumizing', Family = 'MAISON', IsActive = true));
}
if (!existingCodes.contains('shampoo-hydrating')) {
    productsToInsert.add(new Product2(Name = 'Moisture Drench Shampoo', ProductCode = 'shampoo-hydrating', Family = 'MAISON', IsActive = true));
}
if (!existingCodes.contains('shampoo-clarifying')) {
    productsToInsert.add(new Product2(Name = 'Deep Clean Clarifying Shampoo', ProductCode = 'shampoo-clarifying', Family = 'MAISON', IsActive = true));
}
if (!existingCodes.contains('shampoo-color')) {
    productsToInsert.add(new Product2(Name = 'Color Protect Shampoo', ProductCode = 'shampoo-color', Family = 'MAISON', IsActive = true));
}
if (!existingCodes.contains('conditioner-volumizing')) {
    productsToInsert.add(new Product2(Name = 'Weightless Volume Conditioner', ProductCode = 'conditioner-volumizing', Family = 'MAISON', IsActive = true));
}
if (!existingCodes.contains('conditioner-repair')) {
    productsToInsert.add(new Product2(Name = 'Intensive Repair Conditioner', ProductCode = 'conditioner-repair', Family = 'MAISON', IsActive = true));
}
if (!existingCodes.contains('conditioner-color')) {
    productsToInsert.add(new Product2(Name = 'Color Lock Conditioner', ProductCode = 'conditioner-color', Family = 'MAISON', IsActive = true));
}
if (!existingCodes.contains('hair-mask')) {
    productsToInsert.add(new Product2(Name = 'Weekly Repair Hair Mask', ProductCode = 'hair-mask', Family = 'MAISON', IsActive = true));
}
if (!existingCodes.contains('hair-oil')) {
    productsToInsert.add(new Product2(Name = 'Shine & Smooth Hair Oil', ProductCode = 'hair-oil', Family = 'MAISON', IsActive = true));
}
if (!existingCodes.contains('hair-serum')) {
    productsToInsert.add(new Product2(Name = 'Split End Repair Serum', ProductCode = 'hair-serum', Family = 'MAISON', IsActive = true));
}
if (!existingCodes.contains('hair-spray')) {
    productsToInsert.add(new Product2(Name = 'Flexible Hold Hairspray', ProductCode = 'hair-spray', Family = 'MAISON', IsActive = true));
}
if (!existingCodes.contains('hair-mousse')) {
    productsToInsert.add(new Product2(Name = 'Volume Boost Styling Mousse', ProductCode = 'hair-mousse', Family = 'MAISON', IsActive = true));
}
if (!existingCodes.contains('heat-protectant')) {
    productsToInsert.add(new Product2(Name = 'Thermal Shield Heat Protectant', ProductCode = 'heat-protectant', Family = 'MAISON', IsActive = true));
}
if (!existingCodes.contains('dry-shampoo')) {
    productsToInsert.add(new Product2(Name = 'Refresh & Go Dry Shampoo', ProductCode = 'dry-shampoo', Family = 'MAISON', IsActive = true));
}
if (!existingCodes.contains('leave-in-conditioner')) {
    productsToInsert.add(new Product2(Name = 'Detangling Leave-In Conditioner', ProductCode = 'leave-in-conditioner', Family = 'MAISON', IsActive = true));
}
if (!existingCodes.contains('scalp-treatment')) {
    productsToInsert.add(new Product2(Name = 'Scalp Revitalizing Treatment', ProductCode = 'scalp-treatment', Family = 'MAISON', IsActive = true));
}

// ═══════════════════════════════════════════════════════════════════
// INSERT PRODUCTS
// ═══════════════════════════════════════════════════════════════════

System.debug('Products to insert: ' + productsToInsert.size());

if (!productsToInsert.isEmpty()) {
    try {
        insert productsToInsert;
        System.debug('Successfully inserted ' + productsToInsert.size() + ' products');
    } catch (Exception e) {
        System.debug('Error inserting products: ' + e.getMessage());
    }
}

// ═══════════════════════════════════════════════════════════════════
// OUTPUT MAPPING JSON
// ═══════════════════════════════════════════════════════════════════

System.debug('');
System.debug('=== PRODUCT ID MAPPING ===');
System.debug('Copy this JSON to update the app mock products:');
System.debug('');

// Query all products with ProductCode to get the mapping
List<Product2> allProducts = [
    SELECT Id, Name, ProductCode, Family
    FROM Product2
    WHERE ProductCode != null
    ORDER BY Family, Name
];

System.debug('{');
for (Integer i = 0; i < allProducts.size(); i++) {
    Product2 p = allProducts[i];
    String comma = (i < allProducts.size() - 1) ? ',' : '';
    System.debug('  "' + p.ProductCode + '": "' + p.Id + '"' + comma);
}
System.debug('}');

System.debug('');
System.debug('=== COMPLETE ===');
System.debug('Total products in org: ' + allProducts.size());
