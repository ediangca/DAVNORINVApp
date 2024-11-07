
export class ICSItem {
  /**
   *
   */

  // private logger: LogsService = new LogsService();;

  icsItemNo: number | null;
  icsNo: string | null;
  iid: string | null;
  brand: string | null | undefined;;
  model: string | null | undefined;;
  description: string | null;
  serialNo: string | null | undefined;;
  propertyNo: string | null | undefined;;
  qrCode: string | null | undefined;;
  qty: number | null;
  unit: string | null;
  amount: number | null;
  eul: number | null;
  itrFlag: boolean = false;
  itrNo: string | null | undefined;


  // "icsItemNo": 1,
  // "icsNo": "124356",
  // "iid": "ASS0003",
  // "description": "Office Chair Plastic - White",
  // "unit": "pcs",
  // "amount": 500,
  // "qty": 50,
  // "eul": 3,
  // "itrFlag": false,
  // "itrNo": null

  constructor(
    icsItemNo: number | null,
    icsNo: string,
    iid: string,
    brand: string | null | undefined,
    model: string | null | undefined,
    description: string,
    serialNo: string | null | undefined,
    propertyNo: string | null | undefined,
    qrCode: string | null | undefined,
    qty: number,
    unit: string,
    amount: number,
    eul: number,
    itrFlag: boolean = false,
    itrNo: string | null | undefined
  ) {

    this.icsItemNo = icsItemNo;
    this.icsNo = icsNo;
    this.iid = iid;
    this.brand = brand;
    this.model = model;
    this.description = description;
    this.serialNo = serialNo;
    this.propertyNo = propertyNo;
    this.qrCode = qrCode;
    this.qty = qty;
    this.unit = unit;
    this.amount = amount;
    this.eul = eul;
    this.itrFlag = itrFlag;
    this.itrNo = itrNo;

  }



}

