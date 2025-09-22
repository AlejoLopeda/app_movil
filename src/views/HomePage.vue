<script setup lang="ts">
import { ref, onMounted } from 'vue'
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent,
  IonList, IonItem, IonInput, IonButton
} from '@ionic/vue'
import { supabase } from '@/lib/supabaseClient'

type Usuario = { id: string; nombres: string; apellidos: string; edad: number; correo: string; created_at: string }
type UsuarioForm = { nombres: string; apellidos: string; edad: number | null; correo: string }

const usuarios = ref<Usuario[]>([])
const mensaje = ref('')
const form = ref<UsuarioForm>({ nombres: '', apellidos: '', edad: null, correo: '' })

// ---- Cargar
const cargar = async () => {
  const { data, error } = await supabase
    .from('usuarios')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error(error)
    mensaje.value = 'Error cargando usuarios'
  } else {
    usuarios.value = (data ?? []) as Usuario[]
    mensaje.value = `Se cargaron ${usuarios.value.length} usuarios`
  }
}

// ---- Handlers de inputs (evita errores en template)
const onNombreInput = (e: any) => {
  form.value.nombres = ((e?.detail?.value ?? '') as string).toString()
}
const onApellidosInput = (e: any) => {
  form.value.apellidos = ((e?.detail?.value ?? '') as string).toString()
}
const onEdadInput = (e: any) => {
  const v = ((e?.detail?.value ?? '') as string).trim()
  form.value.edad = v === '' ? null : Number(v)
}
const onCorreoInput = (e: any) => {
  form.value.correo = ((e?.detail?.value ?? '') as string).trim()
}

// ---- Insertar
const agregar = async () => {
  mensaje.value = ''

  const payload = {
    nombres: (form.value.nombres ?? '').trim(),
    apellidos: (form.value.apellidos ?? '').trim(),
    correo: (form.value.correo ?? '').trim(),
    edad: Number(form.value.edad)
  }

  const ok =
    payload.nombres.length > 0 &&
    payload.apellidos.length > 0 &&
    payload.correo.length > 0 &&
    Number.isFinite(payload.edad) &&
    payload.edad > 0

  if (!ok) {
    mensaje.value = 'Completa todos los campos.'
    console.log('DEBUG form =>', JSON.parse(JSON.stringify(form.value)))
    return
  }

  const { error } = await supabase.from('usuarios').insert(payload)
  if (error) {
    console.error(error)
    mensaje.value = 'No se pudo guardar: ' + error.message
    return
  }

  mensaje.value = 'Usuario creado ✅'
  form.value = { nombres: '', apellidos: '', edad: null, correo: '' }
  await cargar()
}

onMounted(cargar)
</script>

<template>
  <ion-page>
    <ion-header>
      <ion-toolbar><ion-title>Usuarios</ion-title></ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <p>{{ mensaje }}</p>

      <!-- Lista -->
      <ion-list>
        <ion-item v-for="u in usuarios" :key="u.id">
          {{ u.nombres }} {{ u.apellidos }} — {{ u.edad }} años — {{ u.correo }}
        </ion-item>
      </ion-list>

      <!-- Formulario -->
      <h2 class="ion-margin-top">Nuevo usuario</h2>

      <ion-item>
        <ion-input
          label="Nombres" label-placement="floating"
          :value="form.nombres"
          @ionInput="onNombreInput"
        />
      </ion-item>

      <ion-item>
        <ion-input
          label="Apellidos" label-placement="floating"
          :value="form.apellidos"
          @ionInput="onApellidosInput"
        />
      </ion-item>

      <ion-item>
        <ion-input
          type="number" label="Edad" label-placement="floating"
          :value="form.edad ?? ''"
          @ionInput="onEdadInput"
        />
      </ion-item>

      <ion-item>
        <ion-input
          type="email" label="Correo" label-placement="floating"
          :value="form.correo"
          @ionInput="onCorreoInput"
        />
      </ion-item>

      <ion-button class="ion-margin-top" expand="block" @click="agregar">
        Guardar
      </ion-button>
    </ion-content>
  </ion-page>
</template>
