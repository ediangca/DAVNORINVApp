
export class OPRItem {
  /**
   *
   */

  // private logger: LogsService = new LogsService();;

  oprino: number | null;
  oprNo: string | null;
  iid: string | null;
  brand: string | null;
  model: string | null;
  description: string | null;
  serialNo: string | null;
  propertyNo: string | null;
  qrCode: string | null;
  unit: string | null;
  amount: number | null;
  date_Acquired: Date | null;


  constructor(
    oprino: number | null = null,
    oprNo: string,
    iid: string,
    brand: string,
    model: string,
    description: string,
    serialNo: string,
    propertyNo: string,
    qrCode: string = 'N/A',
    unit: string,
    amount: number,
    date_Acquired: Date | null = null,
  ) {

    this.oprino = oprino;
    this.oprNo = oprNo;
    this.iid = iid;
    this.brand = brand;
    this.model = model;
    this.description = description;
    this.serialNo = serialNo;
    this.propertyNo = propertyNo;
    this.qrCode = qrCode;
    this.unit = unit;
    this.amount = amount;
    this.date_Acquired = date_Acquired;
  }



  // printLog() {
  //   this.logger.printLogs('i',
  //     (this.IID + " : " + this.IID + ", " +
  //       this.QRCode + " : " + this.QRCode + ", " +
  //       this.description + " : " + this.description + ", " +
  //       this.brand + " : " + this.brand + ", " +
  //       this.model + " : " + this.model + ", " +
  //       this.serialNo + " : " + this.serialNo + ", " +
  //       this.propertyNo + " : " + this.propertyNo + ", " +
  //       this.unit + " : " + this.unit + ", " +
  //       this.amount + " : " + this.amount + ", " +
  //       this.date_Acquired + " : " + this.date_Acquired));
  // }



}

