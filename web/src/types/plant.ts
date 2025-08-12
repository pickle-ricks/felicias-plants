export type PlantRow = {
  "Plant Name": string;
  "Image File": string;
  Category: string;
  Light: string;
  Water: string;
  Notes: string;
};

export type WateringRow = {
  plant_name: string;
  category: string | null;
  default_interval_days: number | null;
  last_watered_at: string | null;
  next_water_due_at: string | null;
};


