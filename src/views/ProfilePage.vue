<template>
  <ion-page class="profile-page">
    <app-top-bar :title="'PERFIL DE USUARIO'" />

    <ion-content class="profile-content" fullscreen>
      <!-- Encabezado -->
      <div class="profile-header">
        <AvatarHeader
          :avatar-ready="avatarReady"
          :avatar-preview="avatarPreview"
          :user-name="user.name || '—'"
          :user-email="user.email || '—'"
          :pending-file="pendingFile"
          :is-saving-avatar="isSavingAvatar"
          @open-avatar-modal="avatarModalOpen = true"
          @save-pending-avatar="savePendingAvatar"
          @discard-pending="discardPending"
        />
      </div>

      <!-- Bloque 1: Datos de solo lectura -->
      <div class="profile-info">
        <ion-item lines="none">
          <ion-label>Nombre</ion-label>
          <ion-text>{{ user.name || '—' }}</ion-text>
        </ion-item>
        <ion-item lines="none">
          <ion-label>Correo</ion-label>
          <ion-text>{{ user.email || '—' }}</ion-text>
        </ion-item>
      </div>

      <!-- Bloque 2: Extras -->
      <div class="profile-info">
        <div class="info-header-row">
          <span class="info-title">Información adicional</span>
          <div class="info-actions">
            <ion-button
              v-if="!editExtras"
              size="small"
              fill="outline"
              class="mini"
              @click="enterEditExtras"
            >
              Editar
            </ion-button>

            <ion-button
              v-else
              size="small"
              fill="outline"
              class="mini"
              :disabled="saving"
              @click="cancelEditExtras"
            >
              Cancelar
            </ion-button>
          </div>
        </div>

        <!-- Teléfono -->
        <ion-item lines="none" v-if="!editExtras">
          <ion-label>Teléfono</ion-label>
          <ion-text>{{ extras.phone || '—' }}</ion-text>
        </ion-item>
        <ion-item lines="none" v-else>
          <ion-label position="stacked">Teléfono</ion-label>
          <ion-input v-model="draft.phone" placeholder="Ej: +57 300 000 0000" inputmode="tel" />
        </ion-item>

        <!-- País -->
        <ion-item lines="none" v-if="!editExtras">
          <ion-label>País</ion-label>
          <ion-text>{{ extras.country || '—' }}</ion-text>
        </ion-item>
        <ion-item lines="none" v-else>
          <ion-label position="stacked">País</ion-label>
          <ion-input v-model="draft.country" placeholder="Ej: Colombia" autocapitalize="words" />
        </ion-item>

        <!-- Fecha de nacimiento (solo seteable si está vacía) -->
        <ion-item lines="none" v-if="hasBirthdate">
          <ion-label>Fecha de nacimiento</ion-label>
          <ion-text>{{ formatDate(extras.birthdate) }}</ion-text>
        </ion-item>
        <ion-item lines="none" v-else>
          <ion-label position="stacked">Fecha de nacimiento</ion-label>
          <ion-input type="date" style="--color:#0b3a43; --placeholder-color:#0b3a43; color-scheme:light;"
          v-model="draft.birthdate" />
        </ion-item>
      </div>

      <!-- Bloque 3: Seguridad (Contraseña) -->
      <div class="profile-info">
        <div class="info-header-row">
          <span class="info-title">Seguridad</span>
          <div class="info-actions">
            <ion-button
              v-if="!editPwd"
              size="small"
              fill="outline"
              class="mini"
              @click="enterEditPwd"
            >
              Cambiar contraseña
            </ion-button>
            <ion-button
              v-else
              size="small"
              fill="outline"
              class="mini"
              :disabled="savingPwd"
              @click="cancelEditPwd"
            >
              Cancelar
            </ion-button>
          </div>
        </div>

        <!-- Vista normal: placeholder con ojo -->
        <ion-item lines="none" v-if="!editPwd">
          <ion-label>Contraseña</ion-label>
          <div class="pwd-row">
            <span class="pwd-dots">{{ pwdVisible ? fakePwd : '••••••••••' }}</span>
            <ion-button size="small" fill="clear" class="icon-btn" @click="pwdVisible = !pwdVisible" :aria-label="pwdVisible ? 'Ocultar' : 'Mostrar'">
              <ion-icon :icon="pwdVisible ? eyeOffOutline : eyeOutline" />
            </ion-button>
          </div>
        </ion-item>
        <ion-item lines="none" v-if="!editPwd">
          <ion-note class="hint">Por seguridad no se puede leer tu contraseña actual; solo puedes actualizarla.</ion-note>
        </ion-item>

        <!-- Edición: actual + nueva + confirmar -->
        <template v-else>
          <ion-item lines="none">
            <ion-label position="stacked">Contraseña actual</ion-label>
            <div class="input-with-eye">
              <input
                :type="showCurr ? 'text' : 'password'"
                v-model="pwdForm.current"
                autocomplete="current-password"
                autocapitalize="off"
                inputmode="text"
                class="native-input"
                placeholder="Tu contraseña actual"
                @keyup.enter="savePassword"
              />
              <button class="eye" type="button" @click.stop="showCurr = !showCurr" :aria-label="showCurr? 'Ocultar' : 'Mostrar'">
                <ion-icon :icon="showCurr ? eyeOffOutline : eyeOutline" />
              </button>
            </div>
          </ion-item>

          <ion-item lines="none">
            <ion-label position="stacked">Nueva contraseña</ion-label>
            <div class="input-with-eye">
              <input
                :type="showNew ? 'text' : 'password'"
                v-model="pwdForm.new"
                autocomplete="new-password"
                autocapitalize="off"
                inputmode="text"
                class="native-input"
                placeholder="Mínimo 8, 1 mayúscula y 1 especial"
                @keyup.enter="savePassword"
              />
              <button class="eye" type="button" @click.stop="showNew = !showNew" :aria-label="showNew? 'Ocultar' : 'Mostrar'">
                <ion-icon :icon="showNew ? eyeOffOutline : eyeOutline" />
              </button>
            </div>
          </ion-item>

          <ion-item lines="none">
            <ion-label position="stacked">Confirmar contraseña</ion-label>
            <div class="input-with-eye">
              <input
                :type="showConf ? 'text' : 'password'"
                v-model="pwdForm.confirm"
                autocomplete="new-password"
                autocapitalize="off"
                inputmode="text"
                class="native-input"
                placeholder="Repite la nueva contraseña"
                @keyup.enter="savePassword"
              />
              <button class="eye" type="button" @click.stop="showConf = !showConf" :aria-label="showConf? 'Ocultar' : 'Mostrar'">
                <ion-icon :icon="showConf ? eyeOffOutline : eyeOutline" />
              </button>
            </div>
          </ion-item>

          <ion-item lines="none">
            <ion-note :class="['hint', pwdMsg.color]">{{ pwdMsg.text }}</ion-note>
          </ion-item>
        </template>
      </div>

      <!-- Botón de cerrar sesión -->
      <div class="logout-section">
        <ion-button expand="block" class="btn logout-btn" @click="logout">
          CERRAR SESIÓN
        </ion-button>
      </div>

      <!-- Toasts -->
      <ion-toast :is-open="toast.open" :message="toast.msg" :duration="2200" color="success" @didDismiss="toast.open=false" />
      <ion-toast :is-open="toastErr.open" :message="toastErr.msg" :duration="3000" color="danger" @didDismiss="toastErr.open=false" />

      <!-- inputs ocultos -->
      <input ref="fileInput" type="file" accept="image/*" class="hidden-file" @change="onFileChange" />
      <input ref="cameraInput" type="file" accept="image/*" capture="environment" class="hidden-file" @change="onFileChange" />
    </ion-content>

    <!-- MODAL Avatar grande -->
    <ion-modal :is-open="avatarModalOpen" @didDismiss="avatarModalOpen=false">
      <div class="avatar-modal">
        <img :src="avatarPreview || defaultImage" class="avatar-large" alt="Avatar grande" />
        <div class="avatar-actions">
          <ion-button :disabled="uploading" class="btn" @click="openEditOptions">
            {{ uploading ? 'SUBIENDO…' : 'EDITAR' }}
          </ion-button>
          <ion-button class="btn" @click="avatarModalOpen=false">Cerrar</ion-button>
        </div>
      </div>
    </ion-modal>

    <!-- MODAL de recorte -->
    <ion-modal :is-open="cropModalOpen" @didDismiss="closeCropper">
      <div class="cropper-modal">
        <div class="cropbox">
          <Cropper
            ref="cropperRef"
            :src="tempPreview"
            :stencil-component="CircleStencil"
            :image-restriction="'fit-area'"
            :coordinates="initialCoords"
            :class="'vac-cropper'"
          />
        </div>
        <div class="cropper-actions">
          <ion-button class="btn" @click="confirmCrop">Aplicar</ion-button>
          <ion-button class="btn" @click="closeCropper">Cancelar</ion-button>
        </div>
      </div>
    </ion-modal>

    <!-- Hoja de acciones -->
    <ion-action-sheet
      :is-open="actionOpen"
      header="Seleccionar imagen"
      :buttons="actionButtons"
      @didDismiss="actionOpen=false"
    />
  </ion-page>
</template>

<script setup>
import { onMounted, onUnmounted } from 'vue'
import {
  IonPage, IonContent, IonItem, IonLabel, IonText, IonInput, IonButton,
  IonToast, IonModal, IonActionSheet, IonIcon, IonNote
} from '@ionic/vue'
import AppTopBar from '@/components/AppTopBar.vue'
import AvatarHeader from '@/components/AvatarHeader.vue'
import { eyeOutline, eyeOffOutline } from 'ionicons/icons'
import { Cropper, CircleStencil } from 'vue-advanced-cropper'

/** lógica separada */
import { useProfile } from '@/composables/useProfile'
import { useAvatar } from '@/composables/useAvatar'

/** ===== Profile (datos, extras, contraseña, guardado) ===== */
const {
  user, extras, draft,
  editExtras, enterEditExtras, cancelEditExtras,
  hasBirthdate, formatDate,
  editPwd, enterEditPwd, cancelEditPwd,
  pwdVisible, fakePwd, pwdForm, showCurr, showNew, showConf, savingPwd, pwdMsg,
  validatePassword, savePassword,
  saving, toast, toastErr, logout,
  /** bottom-accept handler (para la barra inferior) */
  handleBottomAccept,
} = useProfile()

/** ===== Avatar (permisos, crop, subir, cache/signed url) ===== */
const {
  defaultImage, uploading, isSavingAvatar,
  avatarReady, avatarPreview, avatarModalOpen,
  actionOpen, actionButtons,
  cropModalOpen, cropperRef, tempPreview, initialCoords,
  fileInput, cameraInput,
  openEditOptions, pickFromCamera, pickFromGallery, onFileChange,
  closeCropper, confirmCrop, discardPending, savePendingAvatar,
  pendingFile,
} = useAvatar({ user, extras, toast, toastErr })

/** reenviar click global del botón de la barra inferior */
onMounted(() => window.addEventListener('bottom-accept', handleBottomAccept))
onUnmounted(() => window.removeEventListener('bottom-accept', handleBottomAccept))
</script>

<style scoped src="@/theme/profile.css"></style>

