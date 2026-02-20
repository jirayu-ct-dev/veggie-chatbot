<script setup lang="ts">
import { ref, computed, watch } from "vue";

useHead({
  title: "จัดการสินค้าผัก/ผลไม้ | Veggie Manager",
  meta: [
    {
      name: "description",
      content: "ระบบจัดการข้อมูลผักและผลไม้ เพิ่ม ลบ แก้ไขสินค้า",
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
  createdAt: string;
  updatedAt: string;
}

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

const categoryLabel = (cat: string) => {
  const found = categories.find((c) => c.value === cat);
  return found ? found.label : cat;
};

const categoryIcon = (cat: string) => {
  const found = categories.find((c) => c.value === cat);
  return found ? found.icon : "📦";
};

const categoryColor = (cat: string) => {
  switch (cat) {
    case "VEGETABLE":
      return "bg-emerald-500/15 text-emerald-400 border-emerald-500/30";
    case "FRUIT":
      return "bg-orange-500/15 text-orange-400 border-orange-500/30";
    default:
      return "bg-slate-500/15 text-slate-400 border-slate-500/30";
  }
};

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
  <div class="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 text-gray-100">
    <!-- Ambient background blobs -->
    <div class="fixed inset-0 overflow-hidden pointer-events-none -z-10">
      <div
        class="absolute -top-40 -left-40 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl animate-pulse"
      ></div>
      <div
        class="absolute top-1/3 -right-32 w-80 h-80 bg-orange-500/8 rounded-full blur-3xl animate-pulse"
        style="animation-delay: 1s"
      ></div>
      <div
        class="absolute -bottom-40 left-1/3 w-96 h-96 bg-teal-500/8 rounded-full blur-3xl animate-pulse"
        style="animation-delay: 2s"
      ></div>
    </div>

    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      <!-- Header -->
      <header class="mb-10">
        <div class="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <div class="flex items-center gap-3 mb-2">
              <div
                class="w-11 h-11 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-xl shadow-lg shadow-emerald-500/25"
              >
                🌿
              </div>
              <h1
                class="text-3xl sm:text-4xl font-extrabold bg-gradient-to-r from-emerald-400 via-teal-300 to-green-400 bg-clip-text text-transparent"
              >
                Veggie Manager
              </h1>
            </div>
            <p class="text-gray-400 text-sm sm:text-base ml-14">
              ระบบจัดการข้อมูลผัก & ผลไม้
            </p>
          </div>
          <NuxtLink
            to="/products/add"
            class="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold rounded-xl shadow-lg shadow-emerald-600/25 transition-all duration-300 hover:shadow-emerald-500/40 hover:-translate-y-0.5 active:translate-y-0"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            เพิ่มสินค้า
          </NuxtLink>
        </div>
      </header>

      <!-- Filters -->
      <div
        class="mb-8 p-4 sm:p-5 bg-gray-800/60 backdrop-blur-xl border border-gray-700/50 rounded-2xl shadow-xl"
      >
        <div class="flex flex-col sm:flex-row gap-4">
          <!-- Search -->
          <div class="relative flex-1">
            <svg
              class="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              stroke-width="2"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"
              />
            </svg>
            <input
              v-model="search"
              type="text"
              placeholder="ค้นหาสินค้า..."
              class="w-full pl-11 pr-4 py-3 bg-gray-900/80 border border-gray-700/50 rounded-xl text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all duration-200"
            />
          </div>

          <!-- Category filter -->
          <div class="flex gap-2 flex-wrap">
            <button
              v-for="cat in categories"
              :key="cat.value"
              @click="selectedCategory = cat.value"
              :class="[
                'px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 border whitespace-nowrap',
                selectedCategory === cat.value
                  ? 'bg-emerald-600/20 text-emerald-300 border-emerald-500/50 shadow-lg shadow-emerald-500/10'
                  : 'bg-gray-900/50 text-gray-400 border-gray-700/50 hover:bg-gray-800 hover:text-gray-300',
              ]"
            >
              <span class="mr-1.5">{{ cat.icon }}</span>
              {{ cat.label }}
            </button>
          </div>
        </div>
      </div>

      <!-- Loading -->
      <div v-if="status === 'pending'" class="flex justify-center py-20">
        <div class="flex flex-col items-center gap-4">
          <div class="relative w-14 h-14">
            <div
              class="absolute inset-0 rounded-full border-4 border-emerald-500/20"
            ></div>
            <div
              class="absolute inset-0 rounded-full border-4 border-transparent border-t-emerald-500 animate-spin"
            ></div>
          </div>
          <p class="text-gray-400 text-sm">กำลังโหลดสินค้า...</p>
        </div>
      </div>

      <!-- Empty state -->
      <div
        v-else-if="!products || products.length === 0"
        class="flex flex-col items-center justify-center py-20 text-center"
      >
        <div
          class="w-24 h-24 rounded-3xl bg-gray-800/60 border border-gray-700/50 flex items-center justify-center text-5xl mb-6"
        >
          🛒
        </div>
        <h3 class="text-xl font-bold text-gray-300 mb-2">ไม่พบสินค้า</h3>
        <p class="text-gray-500 mb-6 max-w-sm">
          {{
            search || selectedCategory !== "ALL"
              ? "ลองเปลี่ยนคำค้นหาหรือตัวกรองดูนะครับ"
              : "เริ่มเพิ่มสินค้าผักผลไม้กันเลย!"
          }}
        </p>
        <NuxtLink
          v-if="!search && selectedCategory === 'ALL'"
          to="/products/add"
          class="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold rounded-xl shadow-lg shadow-emerald-600/25 transition-all duration-300"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          เพิ่มสินค้าตัวแรก
        </NuxtLink>
      </div>

      <!-- Product Grid -->
      <div
        v-else
        class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5"
      >
        <div
          v-for="product in products"
          :key="product.id"
          class="group bg-gray-800/50 backdrop-blur-sm border border-gray-700/40 rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl hover:shadow-emerald-500/5 transition-all duration-300 hover:-translate-y-1 hover:border-gray-600/60"
        >
          <!-- Image -->
          <div class="relative aspect-[4/3] bg-gray-900/60 overflow-hidden">
            <img
              v-if="product.imageUrl"
              :src="product.imageUrl"
              :alt="product.name"
              class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
            <div
              v-else
              class="w-full h-full flex items-center justify-center text-6xl opacity-40"
            >
              {{ categoryIcon(product.category) }}
            </div>

            <!-- Status badge -->
            <div class="absolute top-3 left-3">
              <span
                :class="[
                  'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold backdrop-blur-md border',
                  product.inStock
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                    : 'bg-red-500/20 text-red-300 border-red-500/30',
                ]"
              >
                <span
                  :class="[
                    'w-1.5 h-1.5 rounded-full',
                    product.inStock ? 'bg-emerald-400' : 'bg-red-400',
                  ]"
                ></span>
                {{ product.inStock ? "มีสินค้า" : "หมด" }}
              </span>
            </div>

            <!-- Category badge -->
            <div class="absolute top-3 right-3">
              <span
                :class="[
                  'inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium backdrop-blur-md border',
                  categoryColor(product.category),
                ]"
              >
                {{ categoryIcon(product.category) }}
                {{ categoryLabel(product.category) }}
              </span>
            </div>
          </div>

          <!-- Content -->
          <div class="p-4">
            <h3
              class="text-lg font-bold text-gray-100 mb-1 truncate group-hover:text-emerald-300 transition-colors"
            >
              {{ product.name }}
            </h3>
            <p
              v-if="product.description"
              class="text-gray-500 text-sm mb-3 line-clamp-2 leading-relaxed"
            >
              {{ product.description }}
            </p>
            <div v-else class="mb-3"></div>

            <div class="flex items-end justify-between mb-4">
              <div>
                <span
                  class="text-2xl font-extrabold bg-gradient-to-r from-emerald-400 to-teal-300 bg-clip-text text-transparent"
                >
                  ฿{{ product.price.toLocaleString() }}
                </span>
                <span class="text-gray-500 text-sm ml-1">/ {{ product.unit }}</span>
              </div>
              <div class="text-right">
                <p class="text-xs text-gray-500">คงเหลือ</p>
                <p
                  :class="[
                    'text-sm font-bold',
                    product.stockQty > 0 ? 'text-gray-300' : 'text-red-400',
                  ]"
                >
                  {{ product.stockQty }} {{ product.unit }}
                </p>
              </div>
            </div>

            <!-- Actions -->
            <div class="flex gap-2">
              <NuxtLink
                :to="`/products/${product.id}`"
                class="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-gray-700/50 hover:bg-gray-700 text-gray-300 hover:text-white text-sm font-medium rounded-xl border border-gray-600/30 hover:border-gray-500/50 transition-all duration-200"
              >
                <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
                </svg>
                แก้ไข
              </NuxtLink>
              <button
                @click="openDeleteModal(product)"
                class="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 text-sm font-medium rounded-xl border border-red-500/20 hover:border-red-500/40 transition-all duration-200"
              >
                <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                </svg>
                ลบ
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Delete Modal -->
    <Teleport to="body">
      <Transition name="modal">
        <div
          v-if="showDeleteModal"
          class="fixed inset-0 z-50 flex items-center justify-center p-4"
        >
          <div
            class="absolute inset-0 bg-black/60 backdrop-blur-sm"
            @click="showDeleteModal = false"
          ></div>
          <div
            class="relative w-full max-w-md bg-gray-800 border border-gray-700/60 rounded-2xl shadow-2xl p-6"
          >
            <div class="flex flex-col items-center text-center">
              <!-- Warning icon -->
              <div
                class="w-16 h-16 rounded-2xl bg-red-500/15 border border-red-500/30 flex items-center justify-center mb-4"
              >
                <svg xmlns="http://www.w3.org/2000/svg" class="w-8 h-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
                </svg>
              </div>

              <h3 class="text-xl font-bold text-gray-100 mb-2">ยืนยันการลบ</h3>
              <p class="text-gray-400 mb-6">
                คุณต้องการลบสินค้า
                <span class="font-semibold text-gray-200">"{{ productToDelete?.name }}"</span>
                หรือไม่? การกระทำนี้ไม่สามารถย้อนกลับได้
              </p>

              <div class="flex gap-3 w-full">
                <button
                  @click="showDeleteModal = false"
                  class="flex-1 px-5 py-3 bg-gray-700/50 hover:bg-gray-700 text-gray-300 font-medium rounded-xl border border-gray-600/30 transition-all duration-200"
                >
                  ยกเลิก
                </button>
                <button
                  @click="confirmDelete"
                  :disabled="isDeleting"
                  class="flex-1 px-5 py-3 bg-red-600 hover:bg-red-500 disabled:bg-red-600/50 text-white font-semibold rounded-xl shadow-lg shadow-red-600/25 transition-all duration-200 flex items-center justify-center gap-2"
                >
                  <svg
                    v-if="isDeleting"
                    class="w-4 h-4 animate-spin"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  {{ isDeleting ? "กำลังลบ..." : "ลบสินค้า" }}
                </button>
              </div>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<style scoped>
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.25s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-active .relative,
.modal-leave-active .relative {
  transition: transform 0.25s ease;
}

.modal-enter-from .relative {
  transform: scale(0.95) translateY(10px);
}

.modal-leave-to .relative {
  transform: scale(0.95) translateY(10px);
}
</style>
