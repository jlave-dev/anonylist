<template>
  <section class="hero is-info is-fullheight is-bold">
    <div class="hero-heading">
      <div class="container">
        <div class="navbar-brand">
          <div class="navbar-item">
            <img src="/static/arrow.png">
            <div class="field">
              <p class="control">
                <input class="input code-input"
                       type="text"
                       placeholder="Identifier code"
                       v-model="code">
              </p>
              <p class="help is-white">
                Type code above or after URL as '/?code=YOUR_CODE' to find your items later!
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
    <div class="hero-body">
      <div class="container">
        <div class="columns is-centered">
          <div class="column is-one-third">
            <transition enter-active-class="animated fadeIn"
                        leave-active-class="animated fadeOut">
              <div v-if="items.length"
                   class="card">
                <div class="card-header">
                  <div class="card-header-title"></div>
                  <div class="card-header-icon">
                    <div class="field">
                      <div class="control has-icons-left">
                        <div class="select is-small">
                          <select v-model="sortOrder"
                                  :disabled="items.length <= 1">
                            <option value="none">None</option>
                            <option value="ascending">Ascending (A-Z)</option>
                            <option value="descending">Descending (Z-A)</option>
                          </select>
                        </div>
                        <span class="icon is-small is-left">
                          <i class="fas fa-sort-alpha-up"></i>
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                <div class="card-content">
                  <div class="menu">
                    <ul class="menu-list">
                      <li :key="i"
                          v-for="(item, i) in sortedItems">
                        <a>
                          {{ item }}
                        </a>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </transition>
            <div class="field is-grouped"
                 style="width: 100%">
              <p class="control is-expanded has-icons-right">
                <input class="input"
                       type="text"
                       placeholder="Add an item"
                       v-model="newItem"
                       @keyup.enter="postItem">
                <span v-if="newItem"
                      class="input-icon icon is-small is-right"
                      @click="clearInput">
                  <i class="far fa-times-circle"></i>
                </span>
              </p>
              <p class="control">
                <a class="button is-info is-inverted is-outlined"
                   @click="postItem"
                   :disabled="newItem.length === 0">
                  Save
                </a>
              </p>
            </div>
            <vue-alert></vue-alert>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script>
import debounce from 'debounce';
import randomHex from 'crypto-random-hex';

export default {
  data() {
    return {
      newItem: '',
      items: [],
      code: '',
      isLoading: false,
      sortOrder: 'none',
    };
  },

  computed: {
    sortedItems() {
      const itemsCopy = [...this.items];
      switch (this.sortOrder) {
        case 'ascending':
          return itemsCopy.sort((a, b) => (a.toLowerCase() < b.toLowerCase() ? -1 : 1));
        case 'descending':
          return itemsCopy.sort((a, b) => (a.toLowerCase() < b.toLowerCase() ? 1 : -1));
        default:
          return this.items;
      }
    },
  },

  watch: {
    code() {
      this.items = [];
      debounce(this.onCodeInput, 2000)();
    },

    sortOrder(newOrder) {
      if (newOrder) {
        window.localStorage.setItem('sortOrder', newOrder);
      }
    },
  },

  methods: {
    onCodeInput() {
      window.localStorage.setItem('code', this.code);
      const { code } = this;
      // get items with new code
      fetch('/api/', {
        headers: {
          'content-type': 'application/json',
          'X-Code': code,
        },
        method: 'GET',
      })
        .then(response => response.json())
        .then((json) => {
          this.items = json.items;
        });
    },

    clearInput() {
      this.newItem = '';
    },

    postItem() {
      const { code, newItem: item } = this;
      fetch('/api/', {
        body: JSON.stringify({ item }),
        headers: {
          'content-type': 'application/json',
          'X-Code': code,
        },
        method: 'POST',
      })
        .then((response) => {
          if (response.status === 200) {
            this.items.push(item);
            this.clearInput();
          } else {
            response.json()
              .then(({ message }) => {
                if (message) {
                  this.$alert.danger({ message });
                }
              });
          }
        });
    },
  },

  beforeRouteEnter(to, from, next) {
    if (to.query.code) {
      window.localStorage.setItem('code', to.query.code);
      return next('/');
    } else if (to.query.code === '') {
      return next('/');
    }
    return next();
  },

  mounted() {
    this.code = this.$route.query.code || window.localStorage.getItem('code') || randomHex(16);
    this.sortOrder = window.localStorage.getItem('sortOrder') || 'none';
  },
};
</script>

<style scoped>
.card {
  margin-bottom: 1rem;
}

.control.has-icons-right .icon {
  cursor: default;
  pointer-events: all;
}

.code-input,
.code-input:hover,
.code-input.is-active,
.code-input.is-focused,
.code-input:active,
.code-input:focus {
  background: none;
  color: white;
  box-shadow: none;
  border-color: rgba(0, 0, 0, 0);
  border-bottom: 1px solid white;
}

::placeholder {
  color: #888;
}

.code-input::placeholder {
  color: #eee;
}

.navbar-item {
  max-width: 100vw;
}
</style>
