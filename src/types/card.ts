export interface Card {
  id: string;
  name: string;
  image_uris?: {
    small: string;
    normal: string;
    large: string;
    art_crop: string;
  };
  mana_cost?: string;
  type_line: string;
  oracle_text?: string;
  colors?: string[];
  color_identity: string[];
  cmc: number;
  prices?: {
    usd?: string;
    usd_foil?: string;
  };
}

export interface CardNode extends d3.SimulationNodeDatum {
  id: string;
  name: string;
  image: string;
  popularity: number;
  card: Card;
}

export interface CardLink extends d3.SimulationLinkDatum<CardNode> {
  source: string;
  target: string;
  weight: number;
}