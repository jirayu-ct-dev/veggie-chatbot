<script setup lang="ts">
import { ref } from "vue";
import { useRouter } from "vue-router";

useHead({
  title: "เพิ่มสินค้า | Veggie Manager",
  meta: [
    {
      name: "description",
      content: "เพิ่มสินค้าผักหรือผลไม้ใหม่เข้าสู่ระบบ",
    },
  ],
});

const router = useRouter();

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
const isDragOver = ref(false);
const previewUrl = ref("");
const errorMsg = ref("");

const units = ["กิโลกรัม", "กำ", "แพ็ค", "ขีด", "ลูก", "หัว", "ถุง", "กล่อง"];
const categories = [
  { value: "VEGETABLE", label: "ผัก", icon: "🥬" },
  { value: "FRUIT", label: "ผลไม้", icon: "🍎" },
  { value: "OTHER", label: "อื่นๆ", icon: "📦" },
];

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
    console.error("อัปโหลดรูปผิดพลาด", err);
    errorMsg.value = "อัปโหลดรูปภาพไม่สำเร็จ";
  } finally {
    isUploading.value = false;
  }
}

function onFileSelect(e: Event) {
  const input = e.target as HTMLInputElement;
  if (input.files && input.files[0]) {
    uploadImage(input.files[0]);
  }
}

function onDrop(e: DragEvent) {
  isDragOver.value = false;
  if (e.dataTransfer?.files && e.dataTransfer.files[0]) {
    uploadImage(e.dataTransfer.files[0]);
  }
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
    await $fetch("/api/products", {
      method: "POST",
      body: form.value,
    });
    router.push("/");
  } catch (err: any) {
    errorMsg.value = err?.data?.message || "เกิดข้อผิดพลาดในการเพิ่มสินค้า";
  } finally {
    isSubmitting.value = false;
  }
}
</script>

<template>
  <div class="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 text-gray-100">
    <!-- Ambient blobs -->
    <div class="fixed inset-0 overflow-hidden pointer-events-none -z-10">
      <div class="absolute -top-40 -right-40 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl animate-pulse"></div>
      <div class="absolute bottom-0 left-0 w-80 h-80 bg-teal-500/8 rounded-full blur-3xl animate-pulse" style="animation-delay: 1.5s"></div>
    </div>

    <div class="max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
      <!-- Header -->
      <div class="mb-8">
        <NuxtLink
          to="/"
          class="inline-flex items-center gap-2 text-gray-400 hover:text-emerald-400 text-sm font-medium transition-colors mb-4"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
          </svg>
          กลับหน้าหลัก
        </NuxtLink>
        <h1 class="text-3xl font-extrabold bg-gradient-to-r from-emerald-400 via-teal-300 to-green-400 bg-clip-text text-transparent">
          เพิ่มสินค้าใหม่
        </h1>
        <p class="text-gray-400 mt-1">กรอกข้อมูลสินค้าผัก/ผลไม้ที่ต้องการเพิ่ม</p>
      </div>

      <!-- Error -->
      <div
        v-if="errorMsg"
        class="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl flex items-center gap-3"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 text-red-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
        </svg>
        <span class="text-red-300 text-sm">{{ errorMsg }}</span>
      </div>

      <form @submit.prevent="handleSubmit" class="space-y-6">
        <!-- Image Upload -->
        <div class="bg-gray-800/60 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-6">
          <label class="block text-sm font-semibold text-gray-300 mb-3">รูปภาพสินค้า</label>

          <!-- Preview -->
          <div v-if="previewUrl" class="relative mb-4">
            <img
              :src="previewUrl"
              alt="Preview"
              class="w-full h-64 object-cover rounded-xl border border-gray-700/50"
            />
            <button
              type="button"
              @click="removeImage"
              class="absolute top-3 right-3 w-8 h-8 bg-gray-900/80 backdrop-blur-sm border border-gray-700/50 rounded-lg flex items-center justify-center text-gray-400 hover:text-red-400 hover:border-red-500/50 transition-all"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <!-- Drop zone -->
          <div
            v-else
            @dragover.prevent="isDragOver = true"
            @dragleave="isDragOver = false"
            @drop.prevent="onDrop"
            @click="($refs.fileInput as HTMLInputElement).click()"
            :class="[
              'relative border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-all duration-200',
              isDragOver
                ? 'border-emerald-500/60 bg-emerald-500/5'
                : 'border-gray-700/50 hover:border-gray-600 bg-gray-900/30 hover:bg-gray-900/50',
            ]"
          >
            <div v-if="isUploading" class="flex flex-col items-center gap-3">
              <div class="w-10 h-10 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin"></div>
              <p class="text-gray-400 text-sm">กำลังอัปโหลด...</p>
            </div>
            <div v-else class="flex flex-col items-center gap-3">
              <div class="w-14 h-14 rounded-2xl bg-gray-800 border border-gray-700/50 flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" class="w-7 h-7 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z" />
                </svg>
              </div>
              <div>
                <p class="text-gray-300 font-medium">ลากรูปภาพมาวางที่นี่</p>
                <p class="text-gray-500 text-sm mt-1">หรือคลิกเพื่อเลือกไฟล์ • PNG, JPG, WEBP</p>
              </div>
            </div>
            <input
              ref="fileInput"
              type="file"
              accept="image/*"
              class="hidden"
              @change="onFileSelect"
            />
          </div>
        </div>

        <!-- Product Info -->
        <div class="bg-gray-800/60 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-6 space-y-5">
          <h2 class="text-lg font-bold text-gray-200 flex items-center gap-2">
            <span class="w-1.5 h-6 bg-emerald-500 rounded-full"></span>
            ข้อมูลสินค้า
          </h2>

          <!-- Name -->
          <div>
            <label class="block text-sm font-medium text-gray-400 mb-1.5">ชื่อสินค้า <span class="text-red-400">*</span></label>
            <input
              v-model="form.name"
              type="text"
              placeholder="เช่น กะหล่ำปลี, แอปเปิ้ลฟูจิ"
              class="w-full px-4 py-3 bg-gray-900/80 border border-gray-700/50 rounded-xl text-gray-200 placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all duration-200"
            />
          </div>

          <!-- Description -->
          <div>
            <label class="block text-sm font-medium text-gray-400 mb-1.5">รายละเอียด</label>
            <textarea
              v-model="form.description"
              rows="3"
              placeholder="ประโยชน์, วิธีเก็บรักษา, แหล่งที่มา ..."
              class="w-full px-4 py-3 bg-gray-900/80 border border-gray-700/50 rounded-xl text-gray-200 placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all duration-200 resize-none"
            ></textarea>
          </div>

          <!-- Category -->
          <div>
            <label class="block text-sm font-medium text-gray-400 mb-2">ประเภท</label>
            <div class="flex gap-3">
              <label
                v-for="cat in categories"
                :key="cat.value"
                :class="[
                  'flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl border cursor-pointer transition-all duration-200 text-sm font-medium',
                  form.category === cat.value
                    ? 'bg-emerald-600/20 border-emerald-500/50 text-emerald-300 shadow-lg shadow-emerald-500/10'
                    : 'bg-gray-900/50 border-gray-700/50 text-gray-400 hover:bg-gray-800 hover:text-gray-300',
                ]"
              >
                <input type="radio" :value="cat.value" v-model="form.category" class="hidden" />
                <span>{{ cat.icon }}</span>
                {{ cat.label }}
              </label>
            </div>
          </div>

          <!-- Price & Unit -->
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-400 mb-1.5">ราคา (บาท) <span class="text-red-400">*</span></label>
              <input
                v-model="form.price"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                class="w-full px-4 py-3 bg-gray-900/80 border border-gray-700/50 rounded-xl text-gray-200 placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all duration-200"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-400 mb-1.5">หน่วย</label>
              <select
                v-model="form.unit"
                class="w-full px-4 py-3 bg-gray-900/80 border border-gray-700/50 rounded-xl text-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all duration-200 appearance-none"
              >
                <option v-for="u in units" :key="u" :value="u">{{ u }}</option>
              </select>
            </div>
          </div>

          <!-- Stock -->
          <div class="grid grid-cols-2 gap-4 items-end">
            <div>
              <label class="block text-sm font-medium text-gray-400 mb-1.5">จำนวนสต็อก</label>
              <input
                v-model="form.stockQty"
                type="number"
                step="0.01"
                min="0"
                placeholder="0"
                class="w-full px-4 py-3 bg-gray-900/80 border border-gray-700/50 rounded-xl text-gray-200 placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all duration-200"
              />
            </div>
            <div>
              <label class="flex items-center justify-between py-3 cursor-pointer">
                <span class="text-sm font-medium text-gray-400">สถานะสินค้า</span>
                <div class="relative">
                  <input type="checkbox" v-model="form.inStock" class="sr-only peer" />
                  <div
                    class="w-12 h-7 bg-gray-700 rounded-full peer peer-checked:bg-emerald-600 transition-colors duration-200"
                  ></div>
                  <div
                    class="absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-full shadow-md transition-transform duration-200 peer-checked:translate-x-5"
                  ></div>
                </div>
              </label>
              <p class="text-xs mt-0.5" :class="form.inStock ? 'text-emerald-400' : 'text-red-400'">
                {{ form.inStock ? '✓ มีสินค้า' : '✕ สินค้าหมด' }}
              </p>
            </div>
          </div>
        </div>

        <!-- Submit -->
        <div class="flex gap-3">
          <NuxtLink
            to="/"
            class="flex-1 px-6 py-3.5 bg-gray-800/60 hover:bg-gray-800 text-gray-300 font-medium rounded-xl border border-gray-700/50 text-center transition-all duration-200"
          >
            ยกเลิก
          </NuxtLink>
          <button
            type="submit"
            :disabled="isSubmitting"
            class="flex-1 px-6 py-3.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:from-gray-700 disabled:to-gray-700 text-white font-semibold rounded-xl shadow-lg shadow-emerald-600/25 transition-all duration-300 flex items-center justify-center gap-2"
          >
            <svg
              v-if="isSubmitting"
              class="w-5 h-5 animate-spin"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            <svg v-else xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            {{ isSubmitting ? "กำลังบันทึก..." : "เพิ่มสินค้า" }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>
