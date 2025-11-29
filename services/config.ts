// services/config.ts

// This file centralizes tenant-specific configuration.
// In a real multi-tenant application, this could be loaded dynamically
// based on the hostname or user profile.
export const TENANT_CONFIG = {
  id: 'wim',
  name: 'West Istanbul Marina',
  fullName: 'ADA.MARINA.WIM',
  network: 'wim.ada.network',
};

// The Federation Registry (Global Maritime Network)
// These are the nodes that ADA.MARINA.WIM can "handshake" with.
export const FEDERATION_REGISTRY = {
  peers: [
    {
      id: 'dmaris_gocek',
      name: 'D-Marin Göcek',
      node_address: 'ada.marina.dmarisgocek',
      status: 'ONLINE', // Ready for future integration
      api_endpoint: 'https://api.dmarina.com/gocek'
    },
    {
      id: 'setur_kalamis',
      name: 'Setur Kalamış & Fenerbahçe Marina',
      node_address: 'ada.marina.seturkalamis',
      status: 'ONLINE',
      api_endpoint: 'https://api.seturmarinas.com/kalamis'
    },
    {
      id: 'setur_midilli',
      name: 'Setur Mytilene Marina',
      node_address: 'ada.marina.seturmidilli',
      region: 'GR_AEGEAN', // Cross-border protocol active
      status: 'ONLINE',
      api_endpoint: 'https://api.seturmarinas.com/midilli'
    },
    {
      id: 'ycm_monaco',
      name: 'Yacht Club de Monaco',
      node_address: 'ada.marina.monacoyachtclub',
      tier: 'PRESTIGE_PARTNER',
      status: 'ONLINE',
      api_endpoint: 'https://api.ycm.mc'
    }
  ]
};