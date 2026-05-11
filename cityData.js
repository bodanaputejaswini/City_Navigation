/* =============================================
   Default City Data — "Metro City"
   ~18 locations with realistic connections
   ============================================= */

function getDefaultCityData() {
    return {
        nodes: [
            { id: 'central',     name: 'Central Station',     x: 500, y: 320 },
            { id: 'airport',     name: 'Airport',             x: 900, y: 100 },
            { id: 'university',  name: 'University',          x: 280, y: 160 },
            { id: 'hospital',    name: 'City Hospital',       x: 680, y: 200 },
            { id: 'park',        name: 'City Park',           x: 350, y: 400 },
            { id: 'mall',        name: 'Grand Mall',          x: 650, y: 430 },
            { id: 'stadium',     name: 'Sports Stadium',      x: 180, y: 340 },
            { id: 'museum',      name: 'Art Museum',          x: 420, y: 180 },
            { id: 'harbor',      name: 'Harbor',              x: 850, y: 450 },
            { id: 'techpark',    name: 'Tech Park',           x: 750, y: 320 },
            { id: 'oldtown',     name: 'Old Town',            x: 300, y: 280 },
            { id: 'library',     name: 'Public Library',      x: 480, y: 500 },
            { id: 'market',      name: 'Farmers Market',      x: 150, y: 480 },
            { id: 'hotel',       name: 'Grand Hotel',         x: 580, y: 140 },
            { id: 'cinema',      name: 'Cinema Complex',      x: 530, y: 580 },
            { id: 'govoffice',   name: 'Government Office',   x: 100, y: 180 },
            { id: 'beach',       name: 'Sunset Beach',        x: 920, y: 320 },
            { id: 'trainyard',   name: 'Train Yard',          x: 380, y: 560 }
        ],
        edges: [
            // Central Station connections
            { source: 'central',   dest: 'museum',     weight: 3,  oneWay: false },
            { source: 'central',   dest: 'mall',       weight: 4,  oneWay: false },
            { source: 'central',   dest: 'park',       weight: 3,  oneWay: false },
            { source: 'central',   dest: 'techpark',   weight: 5,  oneWay: false },
            { source: 'central',   dest: 'oldtown',    weight: 4,  oneWay: false },
            { source: 'central',   dest: 'hotel',      weight: 3,  oneWay: false },

            // Airport connections
            { source: 'airport',   dest: 'hospital',   weight: 5,  oneWay: false },
            { source: 'airport',   dest: 'hotel',      weight: 6,  oneWay: false },
            { source: 'airport',   dest: 'beach',      weight: 4,  oneWay: false },

            // University connections
            { source: 'university', dest: 'museum',    weight: 3,  oneWay: false },
            { source: 'university', dest: 'oldtown',   weight: 2,  oneWay: false },
            { source: 'university', dest: 'govoffice', weight: 4,  oneWay: false },
            { source: 'university', dest: 'stadium',   weight: 4,  oneWay: false },

            // Hospital connections
            { source: 'hospital',  dest: 'hotel',      weight: 2,  oneWay: false },
            { source: 'hospital',  dest: 'techpark',   weight: 3,  oneWay: false },

            // Park connections
            { source: 'park',      dest: 'stadium',    weight: 3,  oneWay: false },
            { source: 'park',      dest: 'library',    weight: 3,  oneWay: false },
            { source: 'park',      dest: 'oldtown',    weight: 2,  oneWay: false },

            // Mall connections
            { source: 'mall',      dest: 'techpark',   weight: 2,  oneWay: false },
            { source: 'mall',      dest: 'harbor',     weight: 5,  oneWay: false },
            { source: 'mall',      dest: 'library',    weight: 3,  oneWay: false },

            // Stadium connections
            { source: 'stadium',   dest: 'market',     weight: 3,  oneWay: false },
            { source: 'stadium',   dest: 'govoffice',  weight: 4,  oneWay: false },

            // Harbor connections
            { source: 'harbor',    dest: 'beach',      weight: 3,  oneWay: false },
            { source: 'harbor',    dest: 'techpark',   weight: 4,  oneWay: false },

            // Tech Park connections
            { source: 'techpark',  dest: 'beach',      weight: 4,  oneWay: false },

            // Library connections
            { source: 'library',   dest: 'cinema',     weight: 2,  oneWay: false },
            { source: 'library',   dest: 'trainyard',  weight: 2,  oneWay: false },

            // Market connections
            { source: 'market',    dest: 'trainyard',  weight: 5,  oneWay: false },

            // Cinema connections
            { source: 'cinema',    dest: 'trainyard',  weight: 3,  oneWay: false },

            // One-way roads
            { source: 'hotel',     dest: 'museum',     weight: 2,  oneWay: true },
            { source: 'govoffice', dest: 'museum',     weight: 6,  oneWay: true }
        ]
    };
}
