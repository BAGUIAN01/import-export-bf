// prisma/seed.js
const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

// ============== Helpers ==============
const derivePaymentStatus = (total, paid) => {
  const t = Number(total || 0), p = Number(paid || 0);
  if (p <= 0) return "PENDING";
  if (p < t) return "PARTIAL";
  return "PAID";
};

function randomElement(array) { return array[Math.floor(Math.random() * array.length)]; }
function randomDate(start, end) { return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime())); }
function randomFloat(min, max, decimals = 2) { return parseFloat((Math.random() * (max - min) + min).toFixed(decimals)); }
function randomInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }

// ============== Données ==============
const frenchCities = ["Paris","Lyon","Marseille","Toulouse","Nice","Nantes","Montpellier","Strasbourg","Bordeaux","Lille"];
const burkinaCities = ["Ouagadougou","Bobo-Dioulasso","Koudougou","Banfora","Ouahigouya","Pouytenga","Dédougou","Fada N'gourma","Kaya","Tenkodogo"];

// Tous les types (doivent correspondre à ton enum/validTypes)
const packageTypes = [
  "CARTON","CARTON_MEDIUM","CARTON_LARGE",
  "BARRIQUE","FUT_BLACK_270L",
  "VEHICLE","SUV_4X4","MOTORCYCLE",
  "ELECTRONICS","FRIDGE_SMALL","FRIDGE_STANDARD","FRIDGE_LARGE","FRIDGE_AMERICAN",
  "FREEZER_SMALL","FREEZER_MEDIUM","FREEZER_LARGE","FREEZER_XLARGE",
  "WASHING_MACHINE","STOVE",
  "TV_32","TV_40","TV_48","TV_55","TV_65","TV_75","TV_80","TV_OTHER",
  "VALISE_SMALL","VALISE_MEDIUM","VALISE_LARGE","VALISE_XLARGE",
  "SAC_MEDIUM","SAC_LARGE","SAC_XLARGE",
  "CANTINE_SMALL","CANTINE_MEDIUM","CANTINE_LARGE","CANTINE_XLARGE",
  "CHAIR_STACKABLE","CHAIR_STANDARD","OFFICE_CHAIR","ARMCHAIR","SOFA_SEAT","MATTRESS_SEAT",
  "WINE_6_BOTTLES","WINE_12_BOTTLES","CHAMPAGNE_6_BOTTLES","CHAMPAGNE_12_BOTTLES",
  "CLOTHING","FOOD","DOCUMENTS","GENERATOR_SMALL","INDUSTRIAL","OTHER",
];
const packageStatuses = ["REGISTERED","COLLECTED","IN_CONTAINER","IN_TRANSIT","CUSTOMS","DELIVERED"];
const containerStatuses = ["PREPARATION","LOADED","IN_TRANSIT","CUSTOMS","DELIVERED"];
const paymentMethods = ["CASH","CARD","TRANSFER","MOBILE_MONEY","CHEQUE"]; // <- ajoute CHEQUE (présent dans ton enum)

function getPriceForType(type) {
  const priceMap = {
    CARTON: 40, CARTON_MEDIUM: randomInt(90,140), CARTON_LARGE: randomInt(100,140),
    BARRIQUE: randomInt(120,160), FUT_BLACK_270L: randomInt(120,170),
    VEHICLE: 1500, SUV_4X4: randomInt(2000,2500), MOTORCYCLE: 30,
    ELECTRONICS: 30, FRIDGE_SMALL: 100, FRIDGE_STANDARD: 160, FRIDGE_LARGE: 200, FRIDGE_AMERICAN: 300,
    FREEZER_SMALL: 140, FREEZER_MEDIUM: 300, FREEZER_LARGE: 380, FREEZER_XLARGE: 500,
    WASHING_MACHINE: 120, STOVE: 120,
    TV_32: 90, TV_40: 130, TV_48: 150, TV_55: 180, TV_65: 200, TV_75: 270, TV_80: 300, TV_OTHER: 250,
    VALISE_SMALL: 30, VALISE_MEDIUM: 50, VALISE_LARGE: 70, VALISE_XLARGE: 100,
    SAC_MEDIUM: 60, SAC_LARGE: 70, SAC_XLARGE: 100,
    CANTINE_SMALL: 70, CANTINE_MEDIUM: 120, CANTINE_LARGE: 160, CANTINE_XLARGE: 180,
    CHAIR_STACKABLE: 10, CHAIR_STANDARD: 30, OFFICE_CHAIR: 40, ARMCHAIR: 120, SOFA_SEAT: 100, MATTRESS_SEAT: 60,
    WINE_6_BOTTLES: 10, WINE_12_BOTTLES: 18, CHAMPAGNE_6_BOTTLES: 28, CHAMPAGNE_12_BOTTLES: 32,
    CLOTHING: 40, FOOD: 45, DOCUMENTS: 25, GENERATOR_SMALL: 280, INDUSTRIAL: 200, OTHER: 50,
  };
  return priceMap[type] || 50;
}

// Descriptions par type (identiques à ton fichier, écourtées ici si besoin)
const packageDescriptions = { /* ... (reprends ton objet complet) ... */ };

async function main() {
  console.log("🌱 Début du seeding...");

  // ========== Reset (ajoute Shipments) ==========
  console.log("🧹 Nettoyage de la base de données...");
  await prisma.file.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.whatsAppMessage.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.invoiceItem.deleteMany();
  await prisma.invoice.deleteMany();
  await prisma.trackingUpdate.deleteMany();
  await prisma.package.deleteMany();
  await prisma.shipment.deleteMany();                // 🔵 SHIPMENT: purge avant clients
  await prisma.container.deleteMany();
  await prisma.client.deleteMany();
  await prisma.pricing.deleteMany();
  await prisma.setting.deleteMany();
  await prisma.session.deleteMany();
  await prisma.account.deleteMany();
  await prisma.phoneVerification.deleteMany();
  await prisma.verificationToken.deleteMany();
  await prisma.user.deleteMany();

  // ========== Users ==========
  console.log("👥 Création des utilisateurs...");
  const hashedPassword = await bcrypt.hash("password123", 10);

  const adminUser = await prisma.user.create({
    data: {
      phone: "+33123456789",
      email: "admin@expeditions.fr",
      password: hashedPassword,
      role: "ADMIN",
      firstName: "Admin",
      lastName: "Système",
      name: "Admin Système",
      city: "Paris",
      country: "France",
      isActive: true,
      emailVerified: new Date(),
      lastLoginAt: new Date(),
    },
  });

  const clientUsers = [];
  for (let i = 0; i < 5; i++) {
    const firstName = ["Jean","Marie","Pierre","Sophie","Michel","Catherine","Nicolas","Anne","Laurent","Isabelle"][i%10];
    const lastName = ["Martin","Bernard","Dubois","Thomas","Robert","Petit","Durand","Leroy","Moreau","Simon"][i%10];
    const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}@email.com`;
    const phone = `+3316${randomInt(10000000, 99999999)}`;

    const user = await prisma.user.create({
      data: {
        phone, email, password: hashedPassword, role: "CLIENT",
        firstName, lastName, name: `${firstName} ${lastName}`,
        city: randomElement(frenchCities), country: "France",
        isActive: true,
        emailVerified: new Date(),
        lastLoginAt: randomDate(new Date(2024,0,1), new Date()),
      },
    });
    clientUsers.push(user);
  }

  // ========== Clients ==========
  console.log("👤 Création des clients...");
  const clients = [];

  // liés utilisateurs
  for (let i = 0; i < clientUsers.length; i++) {
    const user = clientUsers[i];
    const recipientFirstName = "Aminata";
    const recipientLastName = "Traoré";

    const client = await prisma.client.create({
      data: {
        clientCode: `CLI${String(i + 1).padStart(3, "0")}`,
        userId: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
        email: user.email,
        address: `${randomInt(1,999)} rue de la Paix`,
        city: user.city, country: "France", postalCode: `${randomInt(10000,99999)}`,
        company: null,
        recipientName: `${recipientFirstName} ${recipientLastName}`,
        recipientPhone: `+22670${randomInt(100000, 999999)}`,
        recipientEmail: `${recipientFirstName.toLowerCase()}@email.bf`,
        recipientAddress: `Secteur ${randomInt(1,50)}, Tanghin`,
        recipientCity: randomElement(burkinaCities),
        recipientRelation: "Famille",
        isVip: Math.random() > 0.8,
        creditLimit: randomFloat(0,5000),
        totalSpent: randomFloat(0,10000),
        notes: null,
      },
    });
    clients.push(client);
  }

  // non liés
  for (let i = 5; i < 15; i++) {
    const firstName = "David"; const lastName = "Lefebvre";
    const recipientFirstName = "Moussa"; const recipientLastName = "Ouedraogo";
    const client = await prisma.client.create({
      data: {
        clientCode: `CLI${String(i + 1).padStart(3, "0")}`,
        firstName, lastName,
        phone: `+3316${randomInt(10000000, 99999999)}`,
        email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@email.com`,
        address: `${randomInt(1,999)} rue Victor Hugo`,
        city: randomElement(frenchCities), country: "France", postalCode: `${randomInt(10000,99999)}`,
        recipientName: `${recipientFirstName} ${recipientLastName}`,
        recipientPhone: `+22670${randomInt(100000, 999999)}`,
        recipientEmail: `${recipientFirstName.toLowerCase()}@email.bf`,
        recipientAddress: `Secteur ${randomInt(1, 50)}, Cissin`,
        recipientCity: randomElement(burkinaCities),
        recipientRelation: "Ami(e)",
        isVip: Math.random() > 0.8,
        creditLimit: randomFloat(0,5000),
        totalSpent: randomFloat(0,10000),
      },
    });
    clients.push(client);
  }

  // ========== Pricings ==========
  console.log("💰 Création des tarifs...");
  const pricings = [
    { type:"CARTON", name:"Carton Standard", description:"Carton 40×40×35 cm", basePrice:40, pickupFee:15, perKgPrice:1.5, minWeight:0, maxWeight:30 },
    { type:"CARTON_MEDIUM", name:"Carton Moyen", description:"Carton 80×50×50 cm", basePrice:115, pickupFee:20, perKgPrice:2, minWeight:0, maxWeight:40 },
    { type:"BARRIQUE", name:"Fût Bleu 220L", description:"Fût bleu", basePrice:140, pickupFee:25, perKgPrice:2, minWeight:30, maxWeight:100 },
    { type:"VEHICLE", name:"Petite Voiture", description:"Voiture", basePrice:1500, pickupFee:100, perKgPrice:0, minWeight:500, maxWeight:2000 },
    { type:"TV_55", name:"TV 55 pouces", description:"TV 55\"", basePrice:180, pickupFee:30, perKgPrice:3, minWeight:10, maxWeight:25 },
  ];
  for (const pricing of pricings) await prisma.pricing.create({ data: pricing });

  // ========== Containers ==========
  console.log("📦 Création des conteneurs...");
  const containers = [];
  for (let i = 0; i < 5; i++) {
    const departureDate = randomDate(new Date(2024,11,1), new Date(2025,2,1));
    const arrivalDate = new Date(departureDate.getTime() + (15 + randomInt(0,10))*86400000);
    const container = await prisma.container.create({
      data: {
        containerNumber: `CNT${new Date().getFullYear()}${String(i+1).padStart(2,"0")}${String(randomInt(1,999)).padStart(3,"0")}`,
        name: `Conteneur ${["Janvier","Février","Mars","Avril","Mai"][i]} 2025`,
        departureDate, arrivalDate,
        actualDeparture: i < 3 ? departureDate : null,
        actualArrival: i < 2 ? arrivalDate : null,
        status: randomElement(containerStatuses),
        capacity: 100, currentLoad: randomInt(0,100),
        maxWeight: 25000, currentWeight: randomFloat(0,25000),
        origin: "France", destination: "Burkina Faso",
        currentLocation: randomElement(["Entrepôt Paris","Port de Marseille","En mer","Port d'Abidjan","Frontière CI/BF","Entrepôt Ouagadougou"]),
        transportCompany: randomElement(["TransAfrica Logistics","Sahel Express","Continental Shipping"]),
        driverName: "Ousmane Kaboré", driverPhone: `+22670${randomInt(100000,999999)}`,
        plateNumber: `BF-${randomInt(1000,9999)}-AA`,
        transportCost: randomFloat(8000,15000),
        customsCost: randomFloat(2000,5000),
        totalCost: randomFloat(10000,20000),
      },
    });
    containers.push(container);
  }

  // ========== Shipments + Packages ==========
  console.log("🚚 Création des expéditions (Shipments) + colis...");
  const allPackages = [];
  const shipments = [];

  // Créer p.ex. 30 expéditions ; chacune 2 à 6 colis
  const shipmentCount = 30;
  for (let i = 0; i < shipmentCount; i++) {
    const client = randomElement(clients);
    const maybeContainer = Math.random() > 0.3 ? randomElement(containers) : null;

    // 🔵 SHIPMENT: créer une expédition d’abord (totaux à 0)
    const year = new Date().getFullYear();
    const shNumber = `SHP${year}${String(i+1).padStart(5,"0")}`;

    const paidAmountShared = Math.random() > 0.5 ? randomFloat(0, 1200) : 0;
    const pickupAddressShared = Math.random() > 0.5 ? `${randomInt(1,999)} rue du Marché, ${client.city}` : null;

    const shipment = await prisma.shipment.create({
      data: {
        shipmentNumber: shNumber,
        clientId: client.id,
        userId: adminUser.id,
        containerId: maybeContainer?.id ?? null,

        pickupAddress: pickupAddressShared,
        pickupDate: Math.random() > 0.5 ? randomDate(new Date(2024,0,1), new Date()) : null,
        pickupTime: Math.random() > 0.5 ? randomElement(["9h-12h","14h-17h"]) : null,
        deliveryAddress: client.recipientAddress,
        specialInstructions: Math.random() > 0.7 ? "Appeler avant livraison" : null,

        paymentMethod: Math.random() > 0.3 ? randomElement(paymentMethods) : null,
        paidAmount: paidAmountShared,
        paidAt: paidAmountShared > 0 ? randomDate(new Date(2024,0,1), new Date()) : null,
        paymentStatus: "PENDING", // ajusté après agrégation
      },
    });

    // 🟠 PACKAGES: créer 2-6 colis rattachés à cette expédition
    const pkgCount = randomInt(2, 6);
    const createdForShipment = [];

    for (let j = 0; j < pkgCount; j++) {
      const t = randomElement(packageTypes);
      const unitPrice = getPriceForType(t);
      const quantity = randomInt(
        1,
        t.includes("VEHICLE") ? 1 : t.includes("CHAIR_") ? 6 : 3
      );

      const weight = randomFloat(1, t.includes("VEHICLE") ? 1200 : t.includes("TV_") ? 35 : 50);
      const pickupFee = Math.random() > 0.5 ? randomFloat(10, 50) : 0;
      const insuranceFee = Math.random() > 0.7 ? randomFloat(5, 30) : 0;
      const customsFee = randomFloat(5, 35);
      const basePrice = unitPrice * quantity;
      const discount = Math.random() > 0.8 ? randomFloat(5, 50) : 0;
      const totalAmount = Math.max(0, basePrice + pickupFee + insuranceFee + customsFee - discount);

      const createdAt = randomDate(new Date(2024,0,1), new Date());
      const estimatedDelivery = new Date(createdAt.getTime() + (20 + randomInt(0, 30)) * 86400000);

      const descChoices = packageDescriptions[t] || ["Articles divers","Colis standard","Marchandise générale"];

      const pkg = await prisma.package.create({
        data: {
          packageNumber: `PKG${year}${String(i*10 + j + 1).padStart(5,"0")}`,
          clientId: client.id,
          containerId: maybeContainer?.id ?? null,
          userId: adminUser.id,

          // lien vers Shipment
          shipmentId: shipment.id,

          // multi-types JSON
          types: JSON.stringify([{ type: t, quantity, unitPrice, isQuoteOnly: false }]),
          totalQuantity: quantity,

          description: randomElement(descChoices),
          weight,
          dimensions: t.includes("VEHICLE")
            ? `${randomInt(400,500)}x${randomInt(180,200)}x${randomInt(140,170)} cm`
            : t.includes("TV_")
            ? `${randomInt(120,180)}x${randomInt(70,110)}x${randomInt(8,15)} cm`
            : `${randomInt(20,80)}x${randomInt(20,60)}x${randomInt(10,40)} cm`,
          value: randomFloat(50, t.includes("VEHICLE") ? 15000 : (t.includes("TV_75")||t.includes("TV_80")) ? 3000 : 2000),

          status: randomElement(packageStatuses),
          priority: randomElement(["LOW","NORMAL","HIGH","URGENT"]),
          isFragile: t.includes("TV_") || t.includes("ELECTRONICS") || t.includes("WINE") || Math.random() > 0.8,
          isInsured: t.includes("VEHICLE") || t.includes("TV_") || t.includes("FRIDGE_") || Math.random() > 0.7,

          pickupAddress: pickupAddressShared,
          pickupDate: Math.random() > 0.5 ? randomDate(createdAt, new Date()) : null,
          pickupTime: Math.random() > 0.5 ? randomElement(["9h-12h","14h-17h","18h-20h"]) : null,

          deliveryAddress: client.recipientAddress,
          deliveryDate: Math.random() > 0.6 ? randomDate(new Date(), estimatedDelivery) : null,

          basePrice,
          pickupFee,
          insuranceFee,
          customsFee,
          discount,
          totalAmount,

          paymentStatus: randomElement(["PENDING","PARTIAL","PAID"]),
          paymentMethod: Math.random() > 0.3 ? randomElement(paymentMethods) : null,
          paidAmount: Math.random() > 0.5 ? randomFloat(0, totalAmount) : 0,
          paidAt: Math.random() > 0.5 ? randomDate(createdAt, new Date()) : null,

          estimatedDelivery,
          specialInstructions: Math.random() > 0.7 ? "Fragile - Manipuler avec précaution" : null,
          createdAt,
          updatedAt: createdAt,
        },
      });

      createdForShipment.push(pkg);
      allPackages.push(pkg);
    }

    // 🔵 SHIPMENT: agrégation des totaux + statut paiement global
    const packagesCount = createdForShipment.length;
    const totalQuantity = createdForShipment.reduce((s,p)=> s + (p.totalQuantity||0), 0);
    const subtotal = createdForShipment.reduce((s,p)=> s + (p.basePrice||0), 0);
    const pickupFeeTotal = createdForShipment.reduce((s,p)=> s + (p.pickupFee||0), 0);
    const insuranceFeeTotal = createdForShipment.reduce((s,p)=> s + (p.insuranceFee||0), 0);
    const customsFeeTotal = createdForShipment.reduce((s,p)=> s + (p.customsFee||0), 0);
    const discountTotal = createdForShipment.reduce((s,p)=> s + (p.discount||0), 0);
    const totalAmount = createdForShipment.reduce((s,p)=> s + (p.totalAmount||0), 0);

    await prisma.shipment.update({
      where: { id: shipment.id },
      data: {
        packagesCount,
        totalQuantity,
        subtotal,
        pickupFeeTotal,
        insuranceFeeTotal,
        customsFeeTotal,
        discountTotal,
        totalAmount,
        paymentStatus: derivePaymentStatus(totalAmount, shipment.paidAmount || 0),
      },
    });

    shipments.push(shipment);
  }

  // ========== Tracking Updates ==========
  console.log("🗺️ Création des mises à jour de tracking...");
  for (const container of containers) {
    const updateCount = randomInt(3, 8);
    for (let i = 0; i < updateCount; i++) {
      await prisma.trackingUpdate.create({
        data: {
          containerId: container.id,
          userId: adminUser.id,
          location: randomElement([
            "Entrepôt Paris - Départ prévu","Port de Marseille - Chargement","En mer - Navigation",
            "Port d'Abidjan - Arrivée","Douanes ivoiriennes - Contrôle","Route vers Burkina - Transport terrestre",
            "Frontière - Formalités","Ouagadougou - Arrivée"
          ]),
          description: randomElement([
            "Conteneur préparé et scellé","Chargement sur le navire en cours","Navigation normale",
            "Arrivée au port","Inspection douanière terminée","Transport terrestre initié",
            "Passage frontière effectué","Conteneur disponible pour livraison"
          ]),
          latitude: randomFloat(4.0, 49.0),
          longitude: randomFloat(-5.0, 2.0),
          isPublic: true,
          timestamp: randomDate(container.departureDate || new Date(2024,11,1), new Date()),
        },
      });
    }
  }

  // ========== Invoices / Payments / Notifications / WhatsApp ==========
  // (Tu peux conserver tes blocs existants inchangés; ils fonctionnent avec Shipment+Package)

  console.log("✅ Seeding terminé !");
  console.log(`👤 Users: ${await prisma.user.count()}`);
  console.log(`🧑‍💼 Clients: ${await prisma.client.count()}`);
  console.log(`🚢 Containers: ${await prisma.container.count()}`);
  console.log(`📦 Packages: ${await prisma.package.count()}`);
  console.log(`📦 Shipments: ${await prisma.shipment.count()}`);

  // Stats types
  console.log('\n📋 Répartition des colis par type :');
  try {
    const all = await prisma.package.findMany({ select: { types: true }});
    const typeStats = {};
    all.forEach(pkg => {
      try {
        const arr = JSON.parse(pkg.types);
        if (Array.isArray(arr)) {
          arr.forEach(({type, quantity=1}) => {
            typeStats[type] = (typeStats[type] || 0) + quantity;
          });
        }
      } catch {}
    });
    const sorted = Object.entries(typeStats).sort(([,a],[,b]) => b-a).slice(0,15);
    sorted.forEach(([type,count]) => console.log(`   - ${type}: ${count} articles`));
    console.log(`\n🔢 Total articles: ${Object.values(typeStats).reduce((s,c)=>s+c,0)}`);
    console.log(`📦 Types différents: ${Object.keys(typeStats).length}`);
  } catch {}
}

main()
  .catch((e) => { console.error("❌ Erreur lors du seeding:", e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
