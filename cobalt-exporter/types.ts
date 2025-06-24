export interface AllSlotsResponse {
  id: number;
  success: boolean;
  slots: {
    slot: number;
    status: "card" | "empty";
    name?: string;
  }[];
}

interface IconDisplayValue {
  display: string;
  hints: {
    "background-color": "green" | "yellow" | string;
  };
}

interface ParameterBase {
  oid: number;
  dataType: "string";
  access: "readOnly";
  widget: string;
  name: string;
  constraint: {
    type: "none";
  };
}

interface StringParameter extends ParameterBase {
  value: string;
  widget: "default" | "lineOnly";
}

interface IconDisplayParameter extends ParameterBase {
  value: IconDisplayValue;
  widget: "iconDisplay";
}

type Parameter = StringParameter | IconDisplayParameter;

export interface SlotResponse {
  id: number;
  success: boolean;
  parameters: Parameter[];
}