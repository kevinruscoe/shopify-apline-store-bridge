<script src="//unpkg.com/alpinejs" defer></script>

<script>
  document.addEventListener('alpine:init', () => {
    /**
     * The cart store
     *
     * @type {Object}
     */
    Alpine.store('cart', {
      /**
       * The cart attributes
       *
       * @type {Object}
       */
      attributes: {},

      /**
       * The cart currency
       *
       * @type {string}
       */
      currency: null,

      /**
       * The cart item count
       *
       * @type {Number}
       */
      item_count: 0,

      /**
       * The cart items
       *
       * @type {Array}
       */
      items: [],

      /**
       * The cart items subtotal price
       *
       * @type {Number}
       */
      items_subtotal_price: 0,

      /**
       * The cart note
       *
       * @type {String}
       */
      note: '',

      /**
       * The cart original total price
       *
       * @type {Number}
       */
      original_total_price: 0,

      /**
       * The cart requires shipping
       *
       * @type {Boolean}
       */
      requires_shipping: false,

      /**
       * The cart token
       *
       * @type {String}
       */
      token: '',

      /**
       * The cart total discount
       *
       * @type {Number}
       */
      total_discount: 0,

      /**
       * The cart total price
       *
       * @type {Number}
       */
      total_price: 0,

      /**
       * The cart total weight
       *
       * @type {Number}
       */
      total_weight: 0,

      /**
       * Initialize the cart store
       *
       * @return {void}
       */
      init() {
        this.get();
      },

      /**
       * Get the cart
       *
       * @fires cart:retreived
       * @return {void}
       */
      get() {
        fetch('/cart.js')
          .then((response) => response.json())
          .then((data) => {
            window.dispatchEvent(new CustomEvent('cart:retreived', { detail: data }));

            this.attributes = data.attributes;
            this.currency = data.currency;
            this.item_count = data.item_count;
            this.items = data.items;
            this.items_subtotal_price = data.items_subtotal_price;
            this.note = data.note;
            this.original_total_price = data.original_total_price;
            this.requires_shipping = data.requires_shipping;
            this.token = data.token;
            this.total_discount = data.total_discount;
            this.total_price = data.total_price;
            this.total_weight = data.total_weight;
          });
      },

      /**
       * Add an item to the cart
       *
       * @fires cart:added
       * @param {Number} id
       * @param {Number} quantity
       * @return {void}
       */
      add(id, quantity) {
        fetch('/cart/add.js', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            id: id,
            quantity: quantity,
          }),
        })
          .then((response) => response.json())
          .then((data) => {
            window.dispatchEvent(new CustomEvent('cart:added', { detail: data }));
            this.get();
          });
      },

      /**
       * Update an item in the cart
       *
       * @fires cart:updated
       * @param {Number} id
       * @param {Number} quantity
       * @return {void}
       */
      update(id, quantity) {
        fetch('/cart/change.js', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            id: id,
            quantity: quantity,
          }),
        })
          .then((response) => response.json())
          .then((data) => {
            window.dispatchEvent(new CustomEvent('cart:updated', { detail: data }));
            this.get();
          });
      },

      /**
       * Remove an item from the cart
       *
       * @fires cart:removed
       * @param {Number} id
       * @return {void}
       */
      remove(id) {
        fetch('/cart/change.js', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            id: id,
            quantity: 0,
          }),
        })
          .then((response) => response.json())
          .then((data) => {
            window.dispatchEvent(new CustomEvent('cart:removed', { detail: data }));
            this.get();
          });
      },

      /**
       * Clear the cart
       *
       * @fires cart:cleared
       * @return {void}
       */
      clear() {
        fetch('/cart/clear.js', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        })
          .then((response) => response.json())
          .then((data) => {
            window.dispatchEvent(new CustomEvent('cart:cleared', { detail: data }));
            this.get();
          });
      },

      /**
       * Get the shipping rates
       *
       * @fires cart:shipping_rates:retreived
       * @param {String} province
       * @param {String} country
       * @param {String} zip
       * @return {Promise}
       */
      getShippingRates(province, country, zip) {
        let querystring = `&shipping_address[province]=${province}&shipping_address[country]=${country}&shipping_address[zip]=${zip}`;

        return new Promise((resolve, reject) => {
            if (! this.requires_shipping) {
              resolve("No shipping required");
            }
          fetch(`/cart/shipping_rates.json?${querystring}`, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            },
          })
            .then((response) => response.json())
            .then((data) => {
              window.dispatchEvent(new CustomEvent('cart:shipping_rates:retreived', { detail: data }));
              resolve(data);
            })
            .catch((error) => {
              reject(error);
            });
        });
      },
    });

    /**
     * The money filter
     *
     * @param  {Number} cents
     * @param  {String} format
     * @return {String}
     */
    Alpine.magic('money', (el, { Alpine }) => {
      return (cents, format) => {
        if (format) {
          format = '${{' + format + '}}';
        }

        if (typeof cents == 'string') {
          cents = cents.replace('.', '');
        }
        var value = '';
        var placeholderRegex = /\{\{\s*(\w+)\s*\}\}/;
        var formatString = format || '{{ cart.currency.symbol }}{% raw %}{{amount}}{% endraw %}';

        function defaultOption(opt, def) {
          return typeof opt == 'undefined' ? def : opt;
        }

        function formatWithDelimiters(number, precision, thousands, decimal) {
          precision = defaultOption(precision, 2);
          thousands = defaultOption(thousands, ',');
          decimal = defaultOption(decimal, '.');

          if (isNaN(number) || number == null) {
            return 0;
          }

          number = (number / 100.0).toFixed(precision);

          var parts = number.split('.'),
            dollars = parts[0].replace(/(\d)(?=(\d\d\d)+(?!\d))/g, '$1' + thousands),
            cents = parts[1] ? decimal + parts[1] : '';

          return dollars + cents;
        }

        switch (formatString.match(placeholderRegex)[1]) {
          case 'amount':
            value = formatWithDelimiters(cents, 2);
            break;
          case 'amount_no_decimals':
            value = formatWithDelimiters(cents, 0);
            break;
          case 'amount_with_comma_separator':
            value = formatWithDelimiters(cents, 2, '.', ',');
            break;
          case 'amount_no_decimals_with_comma_separator':
            value = formatWithDelimiters(cents, 0, '.', ',');
            break;
        }

        return formatString.replace(placeholderRegex, value);
      };
    });
  });
</script>
