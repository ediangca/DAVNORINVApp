
export class ICSItem {
  /**
   *
   */

  // private logger: LogsService = new LogsService();;

  icsItemNo: number | null;
  icsNo: string | null;
  iid: string | null;
  description: string | null;
  qty: number | null;
  unit: string | null;
  amount: number | null;
  eul: number | null;
  itrFlag : boolean = false;
  itrNo : string | null | undefined;


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
    description: string,
    qty: number,
    unit: string,
    amount: number,
    eul: number,
    itrFlag : boolean = false,
    itrNo : string | null | undefined
  ) {

    this.icsItemNo = icsItemNo;
    this.icsNo = icsNo;
    this.iid = iid;
    this.description = description;
    this.qty = qty;
    this.unit = unit;
    this.amount = amount;
    this.eul = eul;
    this.itrFlag = itrFlag;
    this.itrNo = itrNo;

  }



}

