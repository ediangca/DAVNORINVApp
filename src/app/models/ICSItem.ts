
export class ICSItem {
  /**
   *
   */

  // private logger: LogsService = new LogsService();;

  icsItemNo: number | null = null;
  icsNo: string | null = null;
  iid: string | null = null;
  brand: string | null = null;
  model: string | null = null;
  description: string | null = null;
  serialNo: string | null = null;
  propertyNo: string | null = null;
  qrCode: string | null = null;
  qty: number | null = null;
  unit: string | null = null;
  amount: number | null = null;
  date_Acquired: Date | null = null;
  eul: number | null;
  itrFlag: boolean = false;
  itrNo: string | null = null;
  rrsepFlag: boolean = false;
  rrsepNo: string | null = null;


  constructor(
    icsItemNo: number | null = null,
    icsNo: string,
    iid: string,
    brand: string | null = null,
    model: string | null = null,
    description: string,
    serialNo: string | null = null,
    propertyNo: string | null = null,
    qrCode: string | null = null,
    qty: number,
    unit: string,
    amount: number,
    date_Acquired: Date | null,
    eul: number,
    itrFlag: boolean = false,
    itrNo: string | null = null
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
    this.date_Acquired = date_Acquired;
    this.eul = eul;
    this.itrFlag = itrFlag;
    this.itrNo = itrNo;

  }



}

