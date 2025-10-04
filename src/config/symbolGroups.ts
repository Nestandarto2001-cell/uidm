export type GroupId = 'favorites' | 'ai' | 'assessment' | 'defi' | 'l2' | 'memes' | 'gamefi' | 'perp' | 'spot' | 'all';

export const GROUPS = [
  { id: 'favorites', label: 'Избранное' },
  { id: 'ai', label: 'AI' },
  { id: 'assessment', label: 'Оценочная зона' },
  { id: 'defi', label: 'DeFi' },
  { id: 'l2', label: 'L2' },
  { id: 'memes', label: 'Memes' },
  { id: 'gamefi', label: 'GameFi' },
  { id: 'perp', label: 'Perp' },
  { id: 'spot', label: 'Spot' },
  { id: 'all', label: 'Все' },
] as const;

export const GROUP_SYMBOLS: Record<Exclude<GroupId, 'favorites' | 'all'>, string[]> = {
  ai: [
    'FET_USDT', 'AGIX_USDT', 'TAO_USDT', 'AI_USDT', 'OCEAN_USDT',
    'NMR_USDT', 'GRT_USDT', 'CTXC_USDT', 'DBC_USDT', 'AGI_USDT',
    'DTA_USDT', 'AITECH_USDT', 'AIX_USDT', 'SINGULARITY_USDT'
  ],
  assessment: [
    'BTC_USDT', 'ETH_USDT', 'SOL_USDT', 'ADA_USDT', 'DOT_USDT',
    'MATIC_USDT', 'AVAX_USDT', 'LINK_USDT', 'DEGENFI_USDT',
    'ATOM_USDT', 'ALGO_USDT', 'NEAR_USDT', 'FTM_USDT', 'ONE_USDT'
  ],
  defi: [
    'UNI_USDT', 'AAVE_USDT', 'COMP_USDT', 'MKR_USDT', 'SNX_USDT',
    'YFI_USDT', 'CRV_USDT', 'SUSHI_USDT', '1INCH_USDT', 'BAL_USDT',
    'CAKE_USDT', 'PCS_USDT', 'QUICK_USDT', 'JOE_USDT', 'SPIRIT_USDT'
  ],
  l2: [
    'MATIC_USDT', 'OP_USDT', 'ARB_USDT', 'IMX_USDT', 'LRC_USDT',
    'ZK_USDT', 'METIS_USDT', 'BOBA_USDT', 'L2_USDT', 'DYDX_USDT',
    'STARK_USDT', 'ZK_SYNC_USDT', 'BASE_USDT', 'LINEA_USDT'
  ],
  memes: [
    'DOGE_USDT', 'SHIB_USDT', 'PEPE_USDT', 'FLOKI_USDT', 'BONK_USDT',
    'WIF_USDT', 'BOME_USDT', 'MYRO_USDT', 'POPCAT_USDT', 'MEW_USDT',
    'GOAT_USDT', 'BODEN_USDT', 'NEIRO_USDT', 'PNUT_USDT', 'MEME_USDT'
  ],
  gamefi: [
    'AXS_USDT', 'SAND_USDT', 'MANA_USDT', 'ENJ_USDT', 'GALA_USDT',
    'ILV_USDT', 'SLP_USDT', 'CHR_USDT', 'TLM_USDT', 'ALICE_USDT',
    'TLM_USDT', 'GODS_USDT', 'IMX_USDT', 'GMT_USDT', 'STEPN_USDT'
  ],
  perp: [
    'PERP_USDT', 'DYDX_USDT', 'GMX_USDT', 'GNS_USDT', 'CAP_USDT',
    'VRTX_USDT', 'GRAIL_USDT', 'PENDLE_USDT', 'RBN_USDT', 'APEX_USDT',
    'KWENTA_USDT', 'SYNTHETIX_USDT', 'HFT_USDT', 'HXRO_USDT'
  ],
  spot: [
    'BTC_USDT', 'ETH_USDT', 'BNB_USDT', 'XRP_USDT', 'ADA_USDT',
    'SOL_USDT', 'DOT_USDT', 'DOGE_USDT', 'AVAX_USDT', 'SHIB_USDT',
    'MATIC_USDT', 'LTC_USDT', 'BCH_USDT', 'LINK_USDT', 'UNI_USDT'
  ]
};

// All available symbols (for 'all' group)
export const ALL_SYMBOLS = [
  'BTC_USDT', 'ETH_USDT', 'BNB_USDT', 'XRP_USDT', 'ADA_USDT', 'SOL_USDT', 'DOT_USDT',
  'DOGE_USDT', 'AVAX_USDT', 'SHIB_USDT', 'MATIC_USDT', 'LTC_USDT', 'BCH_USDT', 'LINK_USDT',
  'UNI_USDT', 'ATOM_USDT', 'ALGO_USDT', 'VET_USDT', 'FIL_USDT', 'TRX_USDT', 'XLM_USDT',
  'EOS_USDT', 'AAVE_USDT', 'COMP_USDT', 'MKR_USDT', 'SNX_USDT', 'YFI_USDT', 'CRV_USDT',
  'SUSHI_USDT', '1INCH_USDT', 'BAL_USDT', 'CAKE_USDT', 'FET_USDT', 'AGIX_USDT', 'TAO_USDT',
  'AI_USDT', 'OCEAN_USDT', 'NMR_USDT', 'GRT_USDT', 'CTXC_USDT', 'DBC_USDT', 'AGI_USDT',
  'DTA_USDT', 'AITECH_USDT', 'AIX_USDT', 'SINGULARITY_USDT', 'PEPE_USDT', 'FLOKI_USDT',
  'BONK_USDT', 'WIF_USDT', 'BOME_USDT', 'MYRO_USDT', 'POPCAT_USDT', 'MEW_USDT', 'GOAT_USDT',
  'BODEN_USDT', 'NEIRO_USDT', 'PNUT_USDT', 'MEME_USDT', 'AXS_USDT', 'SAND_USDT', 'MANA_USDT',
  'ENJ_USDT', 'GALA_USDT', 'ILV_USDT', 'SLP_USDT', 'CHR_USDT', 'TLM_USDT', 'ALICE_USDT',
  'GODS_USDT', 'IMX_USDT', 'GMT_USDT', 'STEPN_USDT', 'PERP_USDT', 'DYDX_USDT', 'GMX_USDT',
  'GNS_USDT', 'CAP_USDT', 'VRTX_USDT', 'GRAIL_USDT', 'PENDLE_USDT', 'RBN_USDT', 'APEX_USDT',
  'KWENTA_USDT', 'SYNTHETIX_USDT', 'HFT_USDT', 'HXRO_USDT', 'OP_USDT', 'ARB_USDT', 'LRC_USDT',
  'ZK_USDT', 'METIS_USDT', 'BOBA_USDT', 'L2_USDT', 'STARK_USDT', 'ZK_SYNC_USDT', 'BASE_USDT',
  'LINEA_USDT', 'NEAR_USDT', 'FTM_USDT', 'ONE_USDT', 'DEGENFI_USDT'
];
