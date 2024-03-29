/**
 * @jest-environment jsdom
 */

import { fireEvent, screen, waitFor } from '@testing-library/dom';
import BillsUI from '../views/BillsUI.js';
import Bills from '../containers/Bills.js';
import mockStore from '../__mocks__/store.js';
import { bills } from '../fixtures/bills.js';
import { ROUTES, ROUTES_PATH } from '../constants/routes.js';
import { localStorageMock } from '../__mocks__/localStorage.js';
import router from '../app/Router.js';
import '@testing-library/jest-dom/extend-expect';

jest.mock('../app/store', () => mockStore);

//**************************//
// ** TESTS  BillsUi.js ** //
//************************//
describe('Given I am connected as an employee', () => {
  describe('When I am on Bills Page', () => {
    // *** Test to ensure the window icon in vertical layout is highlighted *** //
    test('Then bill icon in vertical layout should be highlighted', async () => {
      // Set up local storage for employee authentication
      Object.defineProperty(window, 'localStorage', {
        value: localStorageMock,
      });
      window.localStorage.setItem(
        'user',
        JSON.stringify({
          type: 'Employee',
        })
      );
      // Create a root element for rendering and append it to the document
      const root = document.createElement('div');
      root.setAttribute('id', 'root');
      document.body.append(root);

      // Set up the router and navigate to the Bills page
      router();
      window.onNavigate(ROUTES_PATH.Bills);

      // Wait for the window icon to be rendered
      await waitFor(() => screen.getByTestId('icon-window'));
      const windowIcon = screen.getByTestId('icon-window');
      // Add assertion
      expect(windowIcon).toBeTruthy();
      expect(windowIcon).toHaveClass('active-icon');
    });

    // *** Test to ensure bills are ordered from earliest to latest *** //
    test('Then bills should be ordered from earliest to latest', () => {
      // Set up the Bills UI with sample data
      document.body.innerHTML = BillsUI({ data: bills });

      // Extract dates from the bills
      const dates = screen
        .getAllByText(
          /^(19|20)\d\d[- /.](0[1-9]|1[012])[- /.](0[1-9]|[12][0-9]|3[01])$/i
        )
        .map((a) => a.innerHTML);

      // Sort the dates in reverse chronological order
      const antiChrono = (a, b) => (a < b ? 1 : -1);
      const datesSorted = [...dates].sort(antiChrono);

      // Add assertion for sorted dates
      expect(dates).toEqual(datesSorted);
    });

    // *** Test to ensure there is a button for a new bill *** //
    test('Then, Bills have a button for a new bill', () => {
      document.body.innerHTML = BillsUI({ data: bills });
      const buttonText = screen.getByText('Nouvelle note de frais');
      expect(buttonText).toBeTruthy();
    });

    // *** Test to ensure eyes icons are present *** //
    test('Then, I see eyes icons', () => {
      document.body.innerHTML = BillsUI({ data: bills });
      const eyesIcons = screen.getAllByTestId('icon-eye');
      expect(eyesIcons).toBeTruthy();
    });
  });
});
//*********************************//
// ** Tests container Bills.js ** //
//*******************************//
describe('Given I am connected as an employee', () => {
  describe('When I am on the Bills page, and I click on eye icon', () => {
    test('Should open a modal, and the displayed file should be present in the document', async () => {
      // Mock local storage for employee authentication
      Object.defineProperty(window, 'localStorage', {
        value: localStorageMock,
      });
      window.localStorage.setItem(
        'user',
        JSON.stringify({
          type: 'Employee',
        })
      );

      // Set up the Bills UI with sample data
      document.body.innerHTML = BillsUI({ data: bills });

      // Define a navigation function for route changes
      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({ pathname });
      };

      // Create a Bills container instance
      const billsContainer = new Bills({
        document,
        onNavigate,
        store: null,
        localStorage: window.localStorage,
      });

      /*  Mock jQuery modal function - Bills.js - line 27 */
      $.fn.modal = jest.fn();

      // Get the first eye icon and simulate a click
      const eyeIcon = screen.getAllByTestId('icon-eye')[0];
      const handleClickIconEye = jest.spyOn(
        billsContainer,
        'handleClickIconEye'
      );
      fireEvent.click(eyeIcon);

      // Check if the modal function and show method are called
      expect(handleClickIconEye).toHaveBeenCalledWith(eyeIcon);
      expect($.fn.modal).toHaveBeenCalledWith('show');

      // Check if an image is present in the modal
      const modalImage = screen.getByAltText('Bill');
      expect(modalImage).toBeInTheDocument();

      // Check if the displayed image URL matches the expected URL from the sample data
      const expectedImageUrl = bills[0].fileUrl;
      expect(modalImage).toHaveAttribute('src', expectedImageUrl);
    });
  });

  describe('When I am on Bills page, and I click on new bill', () => {
    // *** Test to ensure redirection to New Bill page on click *** //
    test('Then I should be redirected to the New Bill page with the title "Envoyer une note de frais"', async () => {
      // Mock local storage for employee authentication
      Object.defineProperty(window, 'localStorage', {
        value: localStorageMock,
      });
      window.localStorage.setItem(
        'user',
        JSON.stringify({
          type: 'Employee',
        })
      );

      // Set up the Bills UI with sample data
      document.body.innerHTML = BillsUI({ data: bills });

      // Define a navigation function for route changes
      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({ pathname });
      };

      // Create a Bills container instance
      new Bills({
        document,
        onNavigate,
        store: null,
        localStorage: window.localStorage,
      });

      const btnNewBill = screen.getByTestId('btn-new-bill');
      expect(btnNewBill).toBeTruthy();

      // Click on the "New Bill" button
      fireEvent.click(btnNewBill);
      // Assert that the user is redirected to the New Bill page with the correct title
      expect(screen.getByText('Envoyer une note de frais')).toBeTruthy();
    });
  });

  // -- Test unitaire method getBills -- //
  describe('When I am on Bills page and the getBills method is called ', () => {
    // Define a navigation function for route changes
    const onNavigate = (pathname) => {
      document.body.innerHTML = ROUTES({ pathname });
    };

    // Create a Bills container instance
    const billsContainer = new Bills({
      document: document,
      onNavigate: onNavigate,
      store: mockStore,
      localStorage: localStorageMock,
    });

    // test to verify that the getBills method returns an array of 4 objects
    test('should return an array of 4 objects', async () => {
      // Call the getBills method
      const bills = await billsContainer.getBills();
      // Assert that the result is an array with a length of 4
      expect(Array.isArray(bills)).toBe(true);
      expect(bills.length).toBe(4);
    });

    // test to verify that the getBills method returns dates formatted correctly
    test('should return dates formatted correctly', async () => {
      const bills = await billsContainer.getBills();
      expect(bills[0].date).toEqual('4 Avr. 04');
    });

    // test to verify that the getBills method returns unformatted date if the date is invalid
    test('should return unformatted date if the date is invalid', async () => {
      jest.spyOn(mockStore, 'bills').mockImplementationOnce(() => {
        const billsList = {
          list() {
            return Promise.resolve([
              {
                status: 'pending',
                date: 'invalid date',
              },
            ]);
          },
        };
        return billsList;
      });

      // Call the getBills method
      const billsArray = await billsContainer.getBills();
      // Assert that the date is returned unformatted for invalid input
      expect(billsArray[0].date).toEqual('invalid date');
    });
  });
});

// -- Test d'intégration GET --
describe('Given I am a user connected as Employee', () => {
  describe('When I navigate on Bill page', () => {
    // *** Test to ensure bills are fetched from the API and displayed *** //
    test('Then, fetches bills from mock API GET', async () => {
      localStorage.setItem(
        'user',
        JSON.stringify({
          type: 'Employee',
          email: 'a@a',
        })
      );
      const root = document.createElement('div');
      root.setAttribute('id', 'root');
      document.body.appendChild(root);
      router();
      window.onNavigate(ROUTES_PATH.Bills);
      await waitFor(() => screen.getByText('Mes notes de frais'));
      const contentPending = screen.getByText('En attente');
      expect(contentPending).toBeTruthy();
    });
    describe('When an error occurs on API', () => {
      beforeEach(() => {
        jest.spyOn(mockStore, 'bills');
        Object.defineProperty(window, 'localStorage', {
          value: localStorageMock,
        });
        window.localStorage.setItem(
          'user',
          JSON.stringify({
            type: 'Employee',
            email: 'a@a',
          })
        );
        const root = document.createElement('div');
        root.setAttribute('id', 'root');
        document.body.appendChild(root);
        router();
      });

      // *** Test to ensure error message is displayed for 404 error *** //
      test('fetches bills from an API and fails with 404 message error', async () => {
        mockStore.bills.mockImplementationOnce(() => {
          return {
            list: () => {
              return Promise.reject(new Error('Erreur 404'));
            },
          };
        });
        window.onNavigate(ROUTES_PATH.Bills);
        await new Promise(process.nextTick);
        const message = screen.getByText(/Erreur 404/);
        expect(message).toBeTruthy();
      });

      // *** Test to ensure error message is displayed for 500 error *** //
      test('fetches messages from an API and fails with 500 message error', async () => {
        mockStore.bills.mockImplementationOnce(() => {
          return {
            list: () => {
              return Promise.reject(new Error('Erreur 500'));
            },
          };
        });

        window.onNavigate(ROUTES_PATH.Bills);
        await new Promise(process.nextTick);
        const message = screen.getByText(/Erreur 500/);
        expect(message).toBeTruthy();
      });
    });
  });
});
