<template>
  <div class="profile-header">
    <button class="avatar-button" @click="$emit('open-avatar-modal')">
      <img v-if="avatarReady && avatarPreview" :src="avatarPreview" alt="Foto de perfil" class="profile-avatar" />
      <div v-else class="avatar-skeleton"></div>
    </button>

    <h2 class="profile-name">{{ userName }}</h2>
    <p class="profile-email">{{ userEmail }}</p>

    <!-- Acciones cuando hay un recorte pendiente -->
    <div v-if="pendingFile" class="avatar-pending-actions">
      <ion-button :disabled="isSavingAvatar" class="btn" @click="$emit('save-pending-avatar')">
        {{ isSavingAvatar ? 'GUARDANDO…' : 'GUARDAR AVATAR' }}
      </ion-button>
      <ion-button class="btn" @click="$emit('discard-pending')">Descartar</ion-button>
    </div>
  </div>
</template>

<script setup>
import { IonButton } from '@ionic/vue'

defineProps({
  avatarReady: { type: Boolean, required: true },
  avatarPreview: { type: String, default: '' },
  userName: { type: String, default: '—' },
  userEmail: { type: String, default: '—' },
  pendingFile: { type: [Object, File, null], default: null },
  isSavingAvatar: { type: Boolean, default: false },
})
</script>

<style scoped>
/* solo estilos mínimos locales del header, el resto vive en profile.css */
.profile-header{ text-align:center; padding:30px 16px 14px; }
.avatar-button{ position:relative; display:inline-block; padding:0; border:0; background:transparent; }
.profile-avatar{
  display:block; width:240px; height:240px; aspect-ratio:1/1; object-fit:cover; border-radius:50%;
  border:4px solid #0b3a43; background:#fff; box-shadow:0 6px 18px rgba(0,0,0,.1);
}
.avatar-skeleton{
  width:240px; height:240px; border-radius:50%;
  background:linear-gradient(90deg,#e9eef1,#f6f9fb,#e9eef1);
  background-size:200% 100%;
  animation:sk 1.2s infinite; border:4px solid #0b3a43; box-shadow:0 6px 18px rgba(0,0,0,.1);
}
@keyframes sk{0%{background-position:0 0}100%{background-position:200% 0}}
.profile-name{ margin-top:12px; font-size:20px; font-weight:800; color:#0b3a43; }
.profile-email{ margin-top:4px; color:#4a6168; font-weight:600; }
.avatar-pending-actions{ margin-top:10px; display:flex; gap:10px; justify-content:center; }
.btn{
  --background:#0b3a43; --color:#fff; --border-radius:14px; --box-shadow:0 6px 20px rgba(11,58,67,.25);
  height:42px; font-weight:800; letter-spacing:.02em; text-transform:uppercase;
}
</style>
