export function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

export function OrganizationSchema() {
  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@type": "Restaurant",
        name: "The Spice Grille",
        alternateName: "Spice Grille Afro-Caribbean Cuisine",
        description:
          "The Spice Grille brings a redefined mix of Afro-Caribbean cuisine to the Fargo-Moorhead area. Wood-fired grill, bold flavors, outdoor seating.",
        url: "https://thespicegrillemn.com",
        telephone: "+12185938000",
        email: "tsgmoorhead@gmail.com",
        logo: "https://thespicegrillemn.com/Spice_Logo.jpg",
        image: "https://thespicegrillemn.com/Fried Yam and Fish.jpg",
        servesCuisine: ["Afro-Caribbean", "West African", "Ghanaian", "Caribbean"],
        priceRange: "$$",
        currencyAccepted: "USD",
        acceptsReservations: true,
        hasMenu: "https://thespicegrillemn.com/menu",
        address: {
          "@type": "PostalAddress",
          streetAddress: "28 Moorhead Center Mall Avenue",
          addressLocality: "Moorhead",
          addressRegion: "MN",
          postalCode: "56560",
          addressCountry: "US",
        },
        geo: {
          "@type": "GeoCoordinates",
          latitude: 46.8739,
          longitude: -96.7676,
        },
        openingHoursSpecification: [
          { "@type": "OpeningHoursSpecification", dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday"], opens: "11:30", closes: "22:00" },
          { "@type": "OpeningHoursSpecification", dayOfWeek: ["Friday", "Saturday"], opens: "11:30", closes: "23:00" },
          { "@type": "OpeningHoursSpecification", dayOfWeek: "Sunday", opens: "12:00", closes: "21:00" },
        ],
        sameAs: [
          "https://www.tiktok.com/@tsgmoorhead",
          "https://www.facebook.com/share/1ETFUY425F/",
          "https://www.instagram.com/thespicegrillemn",
          "https://wa.me/12185938000",
        ],
        aggregateRating: {
          "@type": "AggregateRating",
          ratingValue: "4.9",
          bestRating: "5",
          ratingCount: "127",
        },
      }}
    />
  );
}

export function WebsiteSchema() {
  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@type": "WebSite",
        name: "The Spice Grille",
        url: "https://thespicegrillemn.com",
        potentialAction: {
          "@type": "SearchAction",
          target: {
            "@type": "EntryPoint",
            urlTemplate: "https://thespicegrillemn.com/menu?search={search_term_string}",
          },
          "query-input": "required name=search_term_string",
        },
      }}
    />
  );
}

export function BreadcrumbSchema({ items }: { items: { name: string; url: string }[] }) {
  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: items.map((item, i) => ({
          "@type": "ListItem",
          position: i + 1,
          name: item.name,
          item: item.url,
        })),
      }}
    />
  );
}

export function MenuSchema() {
  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@type": "Menu",
        name: "The Spice Grille Menu",
        description: "Afro-Caribbean cuisine menu featuring West African and Caribbean dishes.",
        url: "https://thespicegrillemn.com/menu",
        hasMenuItem: [
          { "@type": "MenuItem", name: "Fried Yam & Fish", description: "Golden, crispy yam slices with seasoned fried fish.", offers: { "@type": "Offer", price: "14.00", priceCurrency: "USD" } },
          { "@type": "MenuItem", name: "Pounded Yam & Egusi Soup", description: "Smooth pounded yam with rich melon seed egusi soup.", offers: { "@type": "Offer", price: "16.00", priceCurrency: "USD" } },
          { "@type": "MenuItem", name: "Waakye", description: "Fragrant rice and beans with millet leaves, gari, and spaghetti.", offers: { "@type": "Offer", price: "15.00", priceCurrency: "USD" } },
          { "@type": "MenuItem", name: "Grilled Tilapia", description: "Whole tilapia grilled over open flame with signature pepper sauce.", offers: { "@type": "Offer", price: "18.00", priceCurrency: "USD" } },
          { "@type": "MenuItem", name: "Kenkey with Pepper", description: "Fermented corn dough with homemade pepper sauce and fresh fish.", offers: { "@type": "Offer", price: "13.00", priceCurrency: "USD" } },
          { "@type": "MenuItem", name: "Fried Rice", description: "Wok-tossed rice with aromatic spices and fresh vegetables.", offers: { "@type": "Offer", price: "13.00", priceCurrency: "USD" } },
          { "@type": "MenuItem", name: "Fried Chicken", description: "Juicy chicken with secret spice blend, fried to golden perfection.", offers: { "@type": "Offer", price: "12.00", priceCurrency: "USD" } },
          { "@type": "MenuItem", name: "Fresh Mango Drink", description: "Sun-ripened mangoes blended into a smooth tropical refresher.", offers: { "@type": "Offer", price: "5.00", priceCurrency: "USD" } },
          { "@type": "MenuItem", name: "Pineapple Punch", description: "Tangy sweet pineapple juice with a hint of ginger.", offers: { "@type": "Offer", price: "5.00", priceCurrency: "USD" } },
          { "@type": "MenuItem", name: "Strawberry Bliss", description: "Luscious strawberries blended into a vibrant silky drink.", offers: { "@type": "Offer", price: "5.00", priceCurrency: "USD" } },
        ],
      }}
    />
  );
}

export function FaqSchema() {
  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: [
          {
            "@type": "Question",
            name: "What type of cuisine does The Spice Grille serve?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "The Spice Grille serves authentic Afro-Caribbean cuisine, specializing in West African and Ghanaian dishes like jollof rice, banku, tilapia, waakye, fufu, and egusi soup.",
            },
          },
          {
            "@type": "Question",
            name: "Where is The Spice Grille located?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "The Spice Grille is located at 28 Moorhead Center Mall Avenue, Moorhead, MN 56560, serving the Fargo-Moorhead area.",
            },
          },
          {
            "@type": "Question",
            name: "Does The Spice Grille offer delivery or takeout?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "Yes! The Spice Grille offers dine-in, outdoor seating, curbside pickup, and delivery through our online ordering system.",
            },
          },
          {
            "@type": "Question",
            name: "What are The Spice Grille's hours of operation?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "The Spice Grille is open Monday-Thursday 11:30 AM-10:00 PM, Friday-Saturday 11:30 AM-11:00 PM, and Sunday 12:00 PM-9:00 PM.",
            },
          },
          {
            "@type": "Question",
            name: "Does The Spice Grille have happy hour specials?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "Yes! Happy hour is Monday-Friday 4-6 PM with 20% off all drinks and appetizers.",
            },
          },
          {
            "@type": "Question",
            name: "Can I make a reservation at The Spice Grille?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "Yes, reservations are accepted. You can book a table through our website or by calling (218) 593-8000.",
            },
          },
        ],
      }}
    />
  );
}

export function ReviewSchema() {
  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@type": "Review",
        itemReviewed: {
          "@type": "Restaurant",
          name: "The Spice Grille",
          image: "https://thespicegrillemn.com/Spice_Logo.jpg",
        },
        reviewRating: {
          "@type": "Rating",
          ratingValue: "5",
          bestRating: "5",
        },
        author: {
          "@type": "Person",
          name: "Michael Torres",
        },
        reviewBody: "The depth of flavor at Spice Grille is unmatched. Every dish tells a story of passion and precision. The ribeye is simply perfection.",
      }}
    />
  );
}

export function DefaultSeoSchema() {
  return (
    <>
      <OrganizationSchema />
      <WebsiteSchema />
      <MenuSchema />
      <FaqSchema />
    </>
  );
}
