import { ROUTES_PATH } from '../constants/routes.js';
import Logout from './Logout.js';

export default class NewBill {
  constructor({ document, onNavigate, store, localStorage }) {
    this.document = document;
    this.onNavigate = onNavigate;
    this.store = store;
    const formNewBill = this.document.querySelector(
      `form[data-testid="form-new-bill"]`
    );
    formNewBill.addEventListener('submit', (e) => this.handleSubmit(e));
    const file = this.document.querySelector(`input[data-testid="file"]`);
    file.addEventListener('change', (e) => this.handleChangeFile(e));
    this.fileUrl = null;
    this.fileName = null;
    this.billId = null;
    this.isFormImgValid = false;

    new Logout({ document, localStorage, onNavigate });
  }
  handleChangeFile = (e) => {
    e.preventDefault();
    const file = this.document.querySelector(`input[data-testid="file"]`)
      .files[0];
    const fileName = file.name;
    const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    const fileErrorMessage = this.document.querySelector('#fileErrorMessage');
    const submitButton = this.document.querySelector(
      `button[data-testid="submit-button"]`
    );

    // *** BUG FIX : Add a verification to check if the mime type is valid *** //
    // --> If not valid, display an error message and disable the submit button to prevent submission //
    // Code Change : The bill is created during the submit event, not on handleChangeFile method and only if the file format is valid

    // If image format is not valid
    if (!allowedMimeTypes.includes(file.type)) {
      file.value = '';
      fileErrorMessage.textContent =
        'Type de fichier non pris en charge. Seuls les fichiers JPEG, JPG et PNG sont autorisés.';
      submitButton.disabled = true;
      this.isFormImgValid = false;
    } else {
      // If image format is valid
      //If the file is valid change the value to true and remove the error message
      fileErrorMessage.textContent = '';
      submitButton.disabled = false;

      const formData = new FormData();
      const email = JSON.parse(localStorage.getItem('user')).email;

      formData.append('file', file);
      formData.append('email', email);
      this.formData = formData;
      this.fileName = fileName;
      this.isFormImgValid = true;
      // The code that was previously here has been moved to ensure that the update method is only called upon submission (in handleSubmit).
    }
  };
  handleSubmit = (e) => {
    e.preventDefault();
    const email = JSON.parse(localStorage.getItem('user')).email;
    const bill = {
      email,
      type: e.target.querySelector(`select[data-testid="expense-type"]`).value,
      name: e.target.querySelector(`input[data-testid="expense-name"]`).value,
      amount: parseInt(
        e.target.querySelector(`input[data-testid="amount"]`).value
      ),
      date: e.target.querySelector(`input[data-testid="datepicker"]`).value,
      vat: e.target.querySelector(`input[data-testid="vat"]`).value,
      pct:
        parseInt(e.target.querySelector(`input[data-testid="pct"]`).value) ||
        20,
      commentary: e.target.querySelector(`textarea[data-testid="commentary"]`)
        .value,
      fileUrl: this.fileUrl,
      fileName: this.fileName,
      status: 'pending',
    };

    // if image format is valid call the methods to create the bill and call updateBill method
    if (this.isFormImgValid) {
      // this code was moved from handleChangeFile to handleSubmit
      this.store
        .bills()
        .create({
          data: this.formData,
          headers: {
            noContentType: true,
          },
        })
        .then(({ fileUrl, key }) => {
          this.billId = key;
          this.fileUrl = fileUrl;
        })
        .then(() => {
          this.updateBill(bill);
        })
        .catch((error) => console.error(error));
    }
  };

  // not need to cover this function by tests
  updateBill = (bill) => {
    if (this.store) {
      this.store
        .bills()
        .update({ data: JSON.stringify(bill), selector: this.billId })
        .then((res) => {
          this.onNavigate(ROUTES_PATH['Bills']);
        })
        .catch((error) => console.error(error));
    }
  };
}
