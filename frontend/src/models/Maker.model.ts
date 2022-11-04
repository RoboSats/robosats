class Maker {
  public advancedOptions: boolean = false;
  public isExplicit: boolean = false;
  public amount: string = '';
  public paymentMethods: string[] = [];
  public paymentMethodsText: string = 'not specified';
  public badPaymentMethod: boolean = false;
  public premium: number | string = '';
  public satoshis: string = '';
  public publicExpiryTime: Date = new Date(0, 0, 0, 23, 59);
  public publicDuration: number = 86340;
  public escrowExpiryTime: Date = new Date(0, 0, 0, 3, 0);
  public escrowDuration: number = 10800;
  public bondSize: number = 3;
  public minAmount: string = '';
  public maxAmount: string = '';
  public badSatoshisText: string = '';
  public badPremiumText: string = '';
}

export default Maker;
