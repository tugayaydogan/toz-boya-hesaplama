export type ScaleDefinition = {
  id: number;
  scale_no: number;
  scale_name: string;
  station_no: number;
};

export type RecipeItem = {
  scaleNo: number;
  materialCode: string;
  materialName: string;
  plannedConsumption: number;
  actualTargetConsumption: number;
};

export type JobOrder = {
  workOrderNo: string;
  productCode: string;
  productName: string;
  quantity: number;
  recipeCode: string;
  recipe: RecipeItem[];
};

export type ScaleState = ScaleDefinition & {
  materialCode: string;
  materialName: string;
  plannedConsumption: number;

  startWeight: number;

  // Gerçek fiziksel/sanal ağırlık
  processWeight: number;

  // Tartının ekranda gösterdiği ölçüm
  currentWeight: number;

  consumption: number;

  consumptionPerRealSecond: number;
};

export type SimulationState =
  | "IDLE"
  | "RUNNING"
  | "COMPLETED";

export type StartJobSignal = {
  messageType: "START_JOB";
  source: "ERP";
  workOrderNo: string;
  productCode: string;
  productName: string;
  quantity: number;
  recipeCode: string;
};

export type EndJobSignal = {
  messageType: "END_JOB";
  source: "ERP";
  workOrderNo: string;
};

export type ErpSignal =
  | StartJobSignal
  | EndJobSignal;

export type OutgoingMessage = {
  messageType: "JOB_COMPLETED";
  target: "ERP";

  workOrderNo: string;

  status: "COMPLETED";

  completionReason: "ERP_END_SIGNAL";

  simulatedDurationSeconds: number;

  totalPlannedConsumption: number;
  totalActualConsumption: number;
  totalDeviation: number;

  scaleResults: {
    stationNo: number;
    scaleNo: number;

    materialCode: string;

    startWeight: number;
    endWeight: number;

    consumption: number;
  }[];
};

export type EventLevel =
  | "INFO"
  | "SUCCESS"
  | "WARNING";

export type EventLog = {
  id: number;
  time: string;
  level: EventLevel;
  message: string;
};

export type CompletedJobRecord =
  OutgoingMessage & {
    id: string;

    productCode: string;
    productName: string;

    quantity: number;

    recipeCode: string;

    completedAt: string;
  };