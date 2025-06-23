const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Simple CSV parser that handles quoted values
function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  
  result.push(current.trim());
  return result;
}

async function importDeliverables() {
  try {
    console.log('🚀 Starting deliverable import...');
    
    // Read the CSV file
    const csvPath = path.join(__dirname, '..', 'DeliverableListAndPricing.csv');
    const csvContent = fs.readFileSync(csvPath, 'utf-8');
    
    // Parse CSV (improved parsing for quoted values)
    const lines = csvContent.split('\n').filter(line => line.trim());
    const headers = parseCSVLine(lines[0]);
    
    console.log('📋 CSV Headers:', headers);
    
    // Skip header row and process data
    const deliverables = [];
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      const values = parseCSVLine(line);
      
      if (values.length >= 4) {
        const name = values[0].replace(/"/g, '');
        const category = values[1].replace(/"/g, '');
        const primaryCreator = values[2].replace(/"/g, '') || null;
        const retailPriceStr = values[3].replace(/"/g, '').replace(/[$,]/g, '');
        
        // Parse price
        const retailPrice = parseFloat(retailPriceStr);
        
        if (isNaN(retailPrice)) {
          console.warn(`⚠️  Skipping invalid price for "${name}": ${retailPriceStr}`);
          continue;
        }
        
        deliverables.push({
          name,
          category,
          primaryCreator,
          retailPrice,
          active: true
        });
      }
    }
    
    console.log(`📊 Found ${deliverables.length} deliverables to import`);
    
    // Show a few examples for verification
    console.log('\n📝 Sample deliverables:');
    deliverables.slice(0, 5).forEach(d => {
      console.log(`  ${d.name} (${d.category}) - $${d.retailPrice}`);
    });
    
    // Clear existing deliverables (optional - comment out if you want to keep existing)
    console.log('\n🗑️  Clearing existing deliverables...');
    await prisma.deliverable.deleteMany({});
    
    // Import deliverables
    console.log('📥 Importing deliverables...');
    const result = await prisma.deliverable.createMany({
      data: deliverables,
      skipDuplicates: false
    });
    
    console.log(`✅ Successfully imported ${result.count} deliverables`);
    
    // Show summary by category
    const summary = await prisma.deliverable.groupBy({
      by: ['category'],
      _count: {
        category: true
      },
      _avg: {
        retailPrice: true
      }
    });
    
    console.log('\n📈 Import Summary by Category:');
    summary.forEach(cat => {
      console.log(`  ${cat.category}: ${cat._count.category} items, avg price: $${cat._avg.retailPrice?.toFixed(2)}`);
    });
    
    // Show price range
    const priceStats = await prisma.deliverable.aggregate({
      _min: { retailPrice: true },
      _max: { retailPrice: true },
      _avg: { retailPrice: true }
    });
    
    console.log('\n💰 Price Statistics:');
    console.log(`  Min: $${priceStats._min.retailPrice?.toFixed(2)}`);
    console.log(`  Max: $${priceStats._max.retailPrice?.toFixed(2)}`);
    console.log(`  Avg: $${priceStats._avg.retailPrice?.toFixed(2)}`);
    
  } catch (error) {
    console.error('❌ Import failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the import
if (require.main === module) {
  importDeliverables()
    .then(() => {
      console.log('🎉 Import completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Import failed:', error);
      process.exit(1);
    });
}

module.exports = { importDeliverables }; 