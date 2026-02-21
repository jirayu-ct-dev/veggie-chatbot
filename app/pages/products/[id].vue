<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useRouter, useRoute } from "vue-router";

const route = useRoute();
const router = useRouter();
const productId = route.params.id as string;

useHead({
  title: "แก้ไขสินค้า | Veggie Shop",
});

const form = ref({
  name: "",
  description: "",
  price: "",
  unit: "กิโลกรัม",
  category: "VEGETABLE",
  inStock: true,
  stockQty: "",
  imageUrl: "",
});

const isSubmitting = ref(false);
const isUploading = ref(false);
const isLoading = ref(true);
const previewUrl = ref("");
const errorMsg = ref("");

const units = ["กิโลกรัม", "กำ", "แพ็ค", "ขีด", "ลูก", "หัว", "ถุง", "กล่อง"];
const categories = [
  { value: "VEGETABLE", label: "ผัก", icon: "🥬" },
  { value: "FRUIT", label: "ผลไม้", icon: "🍎" },
  { value: "OTHER", label: "อื่นๆ", icon: "📦" },
];

onMounted(async () => {
  try {
    const product = await $fetch<any>(`/api/products/${productId}`);
    form.value = {
      name: product.name,
      description: product.description || "",
      price: String(product.price),
      unit: product.unit,
      category: product.category,
      inStock: product.inStock,
      stockQty: String(product.stockQty),
      imageUrl: product.imageUrl || "",
    };
    previewUrl.value = product.imageUrl || "";
  } catch (err) {
    errorMsg.value = "ไม่พบสินค้าที่ต้องการแก้ไข";
  } finally {
    isLoading.value = false;
  }
});

async function uploadImage(file: File) {
  isUploading.value = true;
  try {
    const formData = new FormData();
    formData.append("file", file);
    const res = await $fetch<{ url: string }>("/api/upload", {
      method: "POST",
      body: formData,
    });
    form.value.imageUrl = res.url;
    previewUrl.value = res.url;
  } catch (err) {
    errorMsg.value = "อัปโหลดรูปภาพไม่สำเร็จ";
  } finally {
    isUploading.value = false;
  }
}

function onFileSelect(e: Event) {
  const input = e.target as HTMLInputElement;
  if (input.files?.[0]) uploadImage(input.files[0]);
}

function removeImage() {
  form.value.imageUrl = "";
  previewUrl.value = "";
}

async function handleSubmit() {
  errorMsg.value = "";
  if (!form.value.name.trim()) {
    errorMsg.value = "กรุณากรอกชื่อสินค้า";
    return;
  }
  if (!form.value.price || parseFloat(form.value.price) <= 0) {
    errorMsg.value = "กรุณากรอกราคาที่ถูกต้อง";
    return;
  }

  isSubmitting.value = true;
  try {
    await $fetch(`/api/products/${productId}`, {
      method: "PUT",
      body: form.value,
    });
    router.push("/");
  } catch (err: any) {
    errorMsg.value = err?.data?.message || "เกิดข้อผิดพลาด";
  } finally {
    isSubmitting.value = false;
  }
}
</script>

<template>
  <div class="min-h-screen bg-white">
    <!-- Header -->
    <header class="sticky top-0 z-30 bg-white border-b border-gray-100">
      <div class="max-w-lg mx-auto px-4 py-3 flex items-center gap-3">
        <NuxtLink to="/" class="text-gray-400 active:text-gray-600">
          <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"
            stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
          </svg>
        </NuxtLink>
        <h1 class="text-base font-bold text-gray-800">แก้ไขสินค้า</h1>
      </div>
    </header>

    <main class="max-w-lg mx-auto px-4 py-5">
      <!-- Loading -->
      <div v-if="isLoading" class="flex justify-center py-20">
        <div class="w-8 h-8 border-3 border-green-500 border-t-transparent rounded-full animate-spin"></div>
      </div>

      <!-- Not found -->
      <div v-else-if="errorMsg && form.name === ''" class="flex flex-col items-center py-20 text-center">
        <span class="text-5xl mb-3">😕</span>
        <p class="text-gray-500 text-sm mb-4">ไม่พบสินค้าที่ต้องการแก้ไข</p>
        <NuxtLink to="/" class="px-5 py-2 bg-green-600 text-white text-sm font-medium rounded-xl">
          กลับหน้าหลัก
        </NuxtLink>
      </div>

      <!-- Form -->
      <template v-else>
        <!-- Error -->
        <div v-if="errorMsg" class="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2">
          <span class="text-red-500 text-sm">⚠️ {{ errorMsg }}</span>
        </div>

        <form @submit.prevent="handleSubmit" class="space-y-5">
          <!-- Image -->
          <div>
            <label class="block text-sm font-medium text-gray-600 mb-2">รูปภาพ</label>
            <div v-if="previewUrl" class="relative">
              <img :src="previewUrl" alt="Preview" class="w-full h-48 object-cover rounded-xl border border-gray-200" />
              <div class="absolute top-2 right-2 flex gap-1.5">
                <button type="button" @click="($refs.fileInput as HTMLInputElement).click()"
                  class="w-7 h-7 bg-white/90 rounded-full flex items-center justify-center text-gray-500 shadow">
                  <svg xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24"
                    stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round"
                      d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
                  </svg>
                </button>
                <button type="button" @click="removeImage"
                  class="w-7 h-7 bg-white/90 rounded-full flex items-center justify-center text-gray-500 active:text-red-500 shadow">
                  <svg xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24"
                    stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            <div v-else @click="($refs.fileInput as HTMLInputElement).click()"
              class="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center cursor-pointer active:bg-gray-50 transition">
              <div v-if="isUploading" class="flex flex-col items-center gap-2">
                <div class="w-8 h-8 border-3 border-green-500 border-t-transparent rounded-full animate-spin"></div>
                <p class="text-gray-400 text-sm">กำลังอัปโหลด...</p>
              </div>
              <div v-else class="flex flex-col items-center gap-2">
                <span class="text-3xl">📷</span>
                <p class="text-sm text-gray-400">แตะเพื่อเลือกรูป</p>
              </div>
            </div>
            <input ref="fileInput" type="file" accept="image/*" class="hidden" @change="onFileSelect" />
          </div>

          <!-- Name -->
          <div>
            <label class="block text-sm font-medium text-gray-600 mb-1">ชื่อสินค้า <span
                class="text-red-400">*</span></label>
            <input v-model="form.name" type="text" placeholder="เช่น กะหล่ำปลี, แอปเปิ้ลฟูจิ"
              class="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-base text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500/30 focus:border-green-400 transition" />
          </div>

          <!-- Description -->
          <div>
            <label class="block text-sm font-medium text-gray-600 mb-1">รายละเอียด</label>
            <textarea v-model="form.description" rows="3" placeholder="ประโยชน์, วิธีเก็บรักษา ..."
              class="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-base text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500/30 focus:border-green-400 transition resize-none"></textarea>
          </div>

          <!-- Category -->
          <div>
            <label class="block text-sm font-medium text-gray-600 mb-2">ประเภท</label>
            <div class="flex gap-2">
              <label v-for="cat in categories" :key="cat.value" :class="[
                'flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl border text-sm font-medium cursor-pointer transition',
                form.category === cat.value
                  ? 'bg-green-600 text-white border-green-600'
                  : 'bg-white text-gray-600 border-gray-200 active:bg-gray-50',
              ]">
                <input type="radio" :value="cat.value" v-model="form.category" class="hidden" />
                <span>{{ cat.icon }}</span>
                {{ cat.label }}
              </label>
            </div>
          </div>

          <!-- Price & Unit -->
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-sm font-medium text-gray-600 mb-1">ราคา (฿) <span
                  class="text-red-400">*</span></label>
              <input v-model="form.price" type="number" step="0.01" min="0" placeholder="0.00"
                class="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-base text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500/30 focus:border-green-400 transition" />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-600 mb-1">หน่วย</label>
              <select v-model="form.unit"
                class="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-base text-gray-700 focus:outline-none focus:ring-2 focus:ring-green-500/30 focus:border-green-400 transition appearance-none">
                <option v-for="u in units" :key="u" :value="u">{{ u }}</option>
              </select>
            </div>
          </div>

          <!-- Stock -->
          <div class="grid grid-cols-2 gap-3 items-end">
            <div>
              <label class="block text-sm font-medium text-gray-600 mb-1">จำนวนสต็อก</label>
              <input v-model="form.stockQty" type="number" step="0.01" min="0" placeholder="0"
                class="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-base text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500/30 focus:border-green-400 transition" />
            </div>
            <div>
              <label class="flex items-center justify-between py-2.5 cursor-pointer">
                <span class="text-sm font-medium text-gray-600">มีสินค้า</span>
                <div class="relative">
                  <input type="checkbox" v-model="form.inStock" class="sr-only peer" />
                  <div class="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:bg-green-500 transition"></div>
                  <div
                    class="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform peer-checked:translate-x-5">
                  </div>
                </div>
              </label>
            </div>
          </div>

          <!-- Buttons -->
          <div class="flex gap-3 pt-2">
            <NuxtLink to="/"
              class="flex-1 py-2.5 bg-gray-100 text-gray-600 text-sm font-medium rounded-xl text-center active:bg-gray-200 transition">
              ยกเลิก
            </NuxtLink>
            <button type="submit" :disabled="isSubmitting"
              class="flex-1 py-2.5 bg-green-600 text-white text-sm font-medium rounded-xl active:bg-green-700 disabled:opacity-50 transition">
              {{ isSubmitting ? "กำลังบันทึก..." : "บันทึก" }}
            </button>
          </div>
        </form>
      </template>
    </main>
  </div>
</template>

<style scoped>
.border-3 {
  border-width: 3px;
}
</style>
