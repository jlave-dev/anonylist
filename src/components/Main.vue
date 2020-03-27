<template>
  <section class="hero is-info is-fullheight is-bold">
    <div class="hero-heading">
      <div class="container">
        <div class="navbar-brand">
          <div class="navbar-item">
            <img src="/static/arrow.png">
            <div class="field">
              <p class="control">
                <input
                  v-model="code"
                  class="input code-input"
                  type="text"
                  placeholder="Identifier code"
                >
              </p>
              <p class="help is-white">
                Type code above or use <a
                  class="link"
                  :href="listUrl"
                  target="_blank"
                >this URL</a> to find your items later!
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
            <transition
              enter-active-class="animated fadeIn"
              leave-active-class="animated fadeOut"
            >
              <div
                v-if="items.length"
                class="card"
              >
                <div class="card-header">
                  <div class="card-header-title" />
                  <div class="card-header-icon">
                    <div class="field">
                      <div class="control has-icons-left">
                        <div class="select is-small">
                          <select
                            v-model="sortOrder"
                            :disabled="items.length <= 1"
                          >
                            <option value="none">
                              None
                            </option>
                            <option value="ascending">
                              Ascending (A-Z)
                            </option>
                            <option value="descending">
                              Descending (Z-A)
                            </option>
                          </select>
                        </div>
                        <span class="icon is-small is-left">
                          <i class="fas fa-sort-alpha-up" />
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                <div class="card-content">
                  <div class="menu">
                    <ul class="menu-list">
                      <li
                        v-for="(item, i) in sortedItems"
                        :key="i"
                      >
                        <a style="display: flex; justify-content: space-between">
                          {{ item }}
                          <div @click="deleteItem(item)">
                            <i class="far fa-trash-alt" />
                          </div>
                        </a>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </transition>
            <div
              class="field is-grouped"
              style="width: 100%"
            >
              <p class="control is-expanded has-icons-right">
                <input
                  v-model="newItem"
                  class="input"
                  type="text"
                  placeholder="Add an item"
                  @keyup.enter="postItem"
                >
                <span
                  v-if="newItem"
                  class="input-icon icon is-small is-right"
                  @click="clearInput"
                >
                  <i class="far fa-times-circle" />
                </span>
              </p>
              <p class="control">
                <a
                  class="button is-info is-inverted is-outlined"
                  :disabled="newItem.length === 0"
                  @click="postItem"
                >
                  Save
                </a>
              </p>
            </div>
            <vue-alert />
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
    listUrl() {
      return `${window.location.href}?code=${this.code}`;
    },

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

  mounted() {
    this.code = this.$route.query.code || window.localStorage.getItem('code') || randomHex(16);
    this.sortOrder = window.localStorage.getItem('sortOrder') || 'none';
  },

  methods: {
    async onCodeInput() {
      this.isLoading = true;
      window.localStorage.setItem('code', this.code);
      // get items with new code
      const listSnapshot = await firebase.firestore().collection('lists').doc(this.code).get();
      if (listSnapshot.exists) {
        this.items = listSnapshot.get('items') || [];
      } else {
        await listSnapshot.ref.set({ items: [] });
        this.items = [];
      }
      this.isLoading = false;
    },

    clearInput() {
      this.newItem = '';
    },

    async postItem() {
      try {
        const list = await firebase.firestore().collection('lists').doc(this.code).get();
        if (list.exists) {
          await firebase.firestore().collection('lists').doc(this.code).update({
            items: firebase.firestore.FieldValue.arrayUnion(this.newItem),
          });
        } else {
          await firebase.firestore().collection('lists').doc(this.code).set({
            items: [this.newItem],
          });
        }
        this.items.push(this.newItem);
        this.clearInput();
      } catch (error) {
        this.$alert.danger({ message: error.message || 'Could not save item.' });
      }
    },

    async deleteItem(itemToDelete) {
      console.log('deleteItem', itemToDelete);
      try {
        await firebase.firestore().collection('lists').doc(this.code).update({
          items: firebase.firestore.FieldValue.arrayRemove(itemToDelete),
        });
        this.items = this.items.filter((item) => item !== itemToDelete);
      } catch (error) {
        this.$alert.danger({ message: error.message || 'Could not delete item.' });
      }
    },
  },

  beforeRouteEnter(to, from, next) {
    if (to.query.code) {
      window.localStorage.setItem('code', to.query.code);
      return next('/');
    } if (to.query.code === '') {
      return next('/');
    }
    return next();
  },
};
</script>

<style scoped>
a.link {
  text-decoration: underline;
}

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
