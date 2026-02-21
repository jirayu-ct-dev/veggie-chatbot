<script setup lang="ts">
import { ref, onMounted } from "vue";

useHead({
  title: "Veggie Shop | ผักผลไม้สดใหม่",
  meta: [
    {
      name: "description",
      content: "ร้านผักผลไม้สดใหม่ คุณภาพดี ราคาถูก สั่งง่ายผ่าน Line",
    },
  ],
});

interface Product {
  id: number;
  name: string;
  description: string | null;
  price: number;
  unit: string;
  category: string;
  inStock: boolean;
  stockQty: number;
  imageUrl: string | null;
}

interface AppUser {
  id: number;
  lineId: string;
  name: string;
  pictureUrl?: string;
  role: "ADMIN" | "USER";
}

// ===== LIFF =====
const liff = ref<any>(null);
const liffReady = ref(false);
const currentUser = ref<AppUser | null>(null);
const isAdmin = computed(() => currentUser.value?.role === "ADMIN");

onMounted(async () => {
  try {
    const liffModule = await import("@line/liff");
    await liffModule.default.init({
      liffId: String(useRuntimeConfig().public.liffId || ""),
    });
    liff.value = liffModule.default;
    liffReady.value = true;

    if (liffModule.default.isLoggedIn()) {
      const profile = await liffModule.default.getProfile();

      // ลงทะเบียน/อัปเดต user ใน database
      const user = await $fetch<AppUser>("/api/auth/line", {
        method: "POST",
        body: {
          lineId: profile.userId,
          displayName: profile.displayName,
          pictureUrl: profile.pictureUrl,
        },
      });
      currentUser.value = user;
    }
  } catch (e) {
    console.warn("LIFF init failed (not in LINE?):", e);
    liffReady.value = true;
  }
});

// ===== Data =====
const search = ref("");
const selectedCategory = ref("ALL");
const showDeleteModal = ref(false);
const productToDelete = ref<Product | null>(null);
const isDeleting = ref(false);

const categories = [
  { value: "ALL", label: "ทั้งหมด", icon: "🍽️" },
  { value: "VEGETABLE", label: "ผัก", icon: "🥬" },
  { value: "FRUIT", label: "ผลไม้", icon: "🍎" },
  { value: "OTHER", label: "อื่นๆ", icon: "📦" },
];

const {
  data: products,
  refresh,
  status,
} = useFetch<Product[]>("/api/products", {
  query: { search, category: selectedCategory },
  watch: [search, selectedCategory],
});

const categoryIcon = (cat: string) => {
  const found = categories.find((c) => c.value === cat);
  return found ? found.icon : "📦";
};

// ===== LIFF: ส่งข้อความกลับ chat =====
function sendToChat(productName: string) {
  if (liff.value?.isInClient?.()) {
    liff.value
      .sendMessages([{ type: "text", text: `สนใจสินค้า: ${productName}` }])
      .then(() => liff.value.closeWindow());
  }
}

// ===== Admin: ลบสินค้า =====
function openDeleteModal(product: Product) {
  productToDelete.value = product;
  showDeleteModal.value = true;
}

async function confirmDelete() {
  if (!productToDelete.value) return;
  isDeleting.value = true;
  try {
    await $fetch(`/api/products/${productToDelete.value.id}`, {
      method: "DELETE",
    });
    showDeleteModal.value = false;
    productToDelete.value = null;
    await refresh();
  } catch (err) {
    console.error("ลบสินค้าผิดพลาด", err);
  } finally {
    isDeleting.value = false;
  }
}
</script>

<template>
  <div class="min-h-screen bg-white">
    <!-- Header -->
    <header class="sticky top-0 z-30 bg-white border-b border-gray-100">
      <div class="max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
        <div class="flex items-center gap-2">
          <span class="text-2xl">🥬</span>
          <h1 class="text-lg font-bold text-gray-800">Veggie Shop</h1>
        </div>
        <div class="flex items-center gap-2">
          <!-- Admin badge -->
          <span v-if="isAdmin" class="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">
            Admin
          </span>
          <!-- User avatar -->
          <img v-if="currentUser?.pictureUrl" :src="currentUser.pictureUrl" :alt="currentUser.name"
            class="w-8 h-8 rounded-full object-cover" />
        </div>
      </div>
    </header>

    <main class="max-w-lg mx-auto px-4 pb-8">
      <!-- Admin: เพิ่มสินค้า -->
      <div v-if="isAdmin" class="mt-4">
        <NuxtLink to="/products/add"
          class="flex items-center justify-center gap-2 w-full py-2.5 bg-green-600 text-white text-sm font-medium rounded-xl active:bg-green-700 transition">
          <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"
            stroke-width="2.5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          เพิ่มสินค้า
        </NuxtLink>
      </div>

      <!-- Search -->
      <div class="mt-4 mb-3">
        <div class="relative">
          <svg class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" xmlns="http://www.w3.org/2000/svg"
            fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round"
              d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
          </svg>
          <input v-model="search" type="text" placeholder="ค้นหาผัก ผลไม้..."
            class="w-full pl-9 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-base text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500/30 focus:border-green-400 transition" />
        </div>
      </div>

      <!-- Category -->
      <div class="flex gap-2 mb-5 overflow-x-auto pb-1 scrollbar-hide">
        <button v-for="cat in categories" :key="cat.value" @click="selectedCategory = cat.value" :class="[
          'flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition',
          selectedCategory === cat.value
            ? 'bg-green-600 text-white'
            : 'bg-gray-100 text-gray-600 active:bg-gray-200',
        ]">
          <span>{{ cat.icon }}</span>
          {{ cat.label }}
        </button>
      </div>

      <!-- Loading -->
      <div v-if="status === 'pending'" class="flex justify-center py-16">
        <div class="w-8 h-8 border-3 border-green-500 border-t-transparent rounded-full animate-spin"></div>
      </div>

      <!-- Empty -->
      <div v-else-if="!products || products.length === 0" class="flex flex-col items-center py-16 text-center">
        <span class="text-5xl mb-3">🛒</span>
        <p class="text-gray-400 text-sm">ไม่พบสินค้า</p>
      </div>

      <!-- Product List -->
      <div v-else class="space-y-3">
        <div v-for="product in products" :key="product.id"
          class="flex gap-3 p-3 bg-white border border-gray-100 rounded-xl transition">
          <!-- Image (tap = ส่ง chat) -->
          <div class="w-20 h-20 rounded-lg bg-gray-50 flex-shrink-0 overflow-hidden cursor-pointer active:opacity-80"
            @click="sendToChat(product.name)">
            <img v-if="product.imageUrl" :src="product.imageUrl" :alt="product.name"
              class="w-full h-full object-cover" />
            <div v-else class="w-full h-full flex items-center justify-center text-3xl">
              {{ categoryIcon(product.category) }}
            </div>
          </div>

          <!-- Info -->
          <div class="flex-1 min-w-0">
            <div class="flex items-start justify-between gap-2">
              <h3 class="text-sm font-semibold text-gray-800 truncate cursor-pointer" @click="sendToChat(product.name)">
                {{ product.name }}
              </h3>
              <span :class="[
                'flex-shrink-0 inline-block w-2 h-2 rounded-full mt-1.5',
                product.inStock ? 'bg-green-500' : 'bg-red-400',
              ]"></span>
            </div>
            <p v-if="product.description" class="text-xs text-gray-400 mt-0.5 line-clamp-1">
              {{ product.description }}
            </p>
            <div class="flex items-end justify-between mt-1.5">
              <div>
                <span class="text-base font-bold text-green-600">฿{{ product.price }}</span>
                <span class="text-xs text-gray-400 ml-0.5">/{{ product.unit }}</span>
              </div>
              <span :class="[
                'text-xs',
                product.inStock ? 'text-gray-400' : 'text-red-400 font-medium',
              ]">
                {{ product.inStock ? `เหลือ ${product.stockQty} ${product.unit}` : "สินค้าหมด" }}
              </span>
            </div>

            <!-- Admin actions -->
            <div v-if="isAdmin" class="flex gap-2 mt-2">
              <NuxtLink :to="`/products/${product.id}`"
                class="flex items-center gap-1 px-2.5 py-1 bg-blue-50 text-blue-600 text-xs font-medium rounded-lg active:bg-blue-100 transition">
                <svg xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24"
                  stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round"
                    d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Z" />
                </svg>
                แก้ไข
              </NuxtLink>
              <button @click="openDeleteModal(product)"
                class="flex items-center gap-1 px-2.5 py-1 bg-red-50 text-red-500 text-xs font-medium rounded-lg active:bg-red-100 transition">
                <svg xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24"
                  stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round"
                    d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                </svg>
                ลบ
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>

    <!-- Delete Modal -->
    <Teleport to="body">
      <Transition name="modal">
        <div v-if="showDeleteModal" class="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          <div class="absolute inset-0 bg-black/40" @click="showDeleteModal = false"></div>
          <div class="relative w-full max-w-lg bg-white rounded-t-2xl sm:rounded-2xl p-5 safe-bottom">
            <h3 class="text-base font-bold text-gray-800 mb-2">ยืนยันการลบ</h3>
            <p class="text-sm text-gray-500 mb-5">
              ต้องการลบ
              <span class="font-semibold text-gray-700">"{{ productToDelete?.name }}"</span>
              หรือไม่?
            </p>
            <div class="flex gap-3">
              <button @click="showDeleteModal = false"
                class="flex-1 py-2.5 bg-gray-100 text-gray-600 text-sm font-medium rounded-xl active:bg-gray-200 transition">
                ยกเลิก
              </button>
              <button @click="confirmDelete" :disabled="isDeleting"
                class="flex-1 py-2.5 bg-red-500 text-white text-sm font-medium rounded-xl active:bg-red-600 disabled:opacity-50 transition">
                {{ isDeleting ? "กำลังลบ..." : "ลบสินค้า" }}
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<style scoped>
.line-clamp-1 {
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.scrollbar-hide::-webkit-scrollbar {
  display: none;
}

.scrollbar-hide {
  -ms-overflow-style: none;
  scrollbar-width: none;
}

.border-3 {
  border-width: 3px;
}

.safe-bottom {
  padding-bottom: max(1.25rem, env(safe-area-inset-bottom));
}

.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.2s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}
</style>
