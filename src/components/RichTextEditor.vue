<script setup lang="ts">
import { ref, watch } from 'vue'
import { Ckeditor } from '@ckeditor/ckeditor5-vue'
import {
  ClassicEditor,
  Essentials,
  Paragraph,
  Heading,
  Bold,
  Italic,
  Underline,
  Strikethrough,
  RemoveFormat,
  Link,
  AutoLink,
  List,
  TodoList,
  Indent,
  IndentBlock,
  BlockQuote,
  Table,
  TableToolbar,
  TableProperties,
  TableCellProperties,
  Image,
  ImageToolbar,
  ImageCaption,
  ImageStyle,
  ImageResize,
  ImageUpload,
  Base64UploadAdapter,
  MediaEmbed,
  Alignment,
  FontColor,
  FontBackgroundColor,
  FontSize,
  FontFamily,
  HorizontalLine,
  SourceEditing,
  PasteFromOffice,
  type EditorConfig,
} from 'ckeditor5'
import 'ckeditor5/ckeditor5.css'

const props = defineProps<{ modelValue: string }>()
const emit = defineEmits<{ 'update:modelValue': [value: string] }>()

// `@ckeditor/ckeditor5-vue`ning o'zi ham xuddi shu turdagi "poyga holati"ga
// ega: uning ichki `watch(model, ...)` kuzatuvchisi tashqi propni to'g'ridan-
// to'g'ri `editor.data.set()`ga uzatadi, muharrir hozir fokusda (foydalanuvchi
// ayni damda yozayotgan) bo'lsa ham. Shu sabab tashqi `modelValue` propini
// bevosita `<Ckeditor>`ga bermaymiz — o'rniga mahalliy `internalValue` orqali
// o'zimiz nazorat qilamiz: tashqi qiymat faqat muharrir FOKUSDA BO'LMAGANDA
// qabul qilinadi. Bu — Info'dagi til-tablarini almashtirish kabi tashqi
// o'zgarishlar to'g'ri ishlashini, lekin yozish paytida oxirgi harflar
// "yutib yuborilishi"ni oldini oladi.
const internalValue = ref(props.modelValue)
const isFocused = ref(false)

function onUpdate(value: unknown) {
  internalValue.value = String(value)
  emit('update:modelValue', String(value))
}

function onFocus() {
  isFocused.value = true
}

function onBlur() {
  isFocused.value = false
}

watch(
  () => props.modelValue,
  (value) => {
    if (isFocused.value) return
    if (value !== internalValue.value) internalValue.value = value
  },
)

const editorConfig: EditorConfig = {
  licenseKey: 'GPL',
  plugins: [
    Essentials,
    Paragraph,
    Heading,
    Bold,
    Italic,
    Underline,
    Strikethrough,
    RemoveFormat,
    Link,
    AutoLink,
    List,
    TodoList,
    Indent,
    IndentBlock,
    BlockQuote,
    Table,
    TableToolbar,
    TableProperties,
    TableCellProperties,
    Image,
    ImageToolbar,
    ImageCaption,
    ImageStyle,
    ImageResize,
    ImageUpload,
    Base64UploadAdapter,
    MediaEmbed,
    Alignment,
    FontColor,
    FontBackgroundColor,
    FontSize,
    FontFamily,
    HorizontalLine,
    SourceEditing,
    PasteFromOffice,
  ],
  toolbar: [
    'undo', 'redo', '|',
    'heading', '|',
    'fontFamily', 'fontSize', 'fontColor', 'fontBackgroundColor', '|',
    'bold', 'italic', 'underline', 'strikethrough', 'removeFormat', '|',
    'alignment', 'bulletedList', 'numberedList', 'todoList', 'outdent', 'indent', '|',
    'link', 'blockQuote', 'insertTable', 'uploadImage', 'mediaEmbed', 'horizontalLine', '|',
    'sourceEditing',
  ],
  image: {
    toolbar: ['imageStyle:inline', 'imageStyle:block', 'imageStyle:side', '|', 'toggleImageCaption', 'imageTextAlternative', '|', 'resizeImage'],
  },
  table: {
    contentToolbar: ['tableColumn', 'tableRow', 'mergeTableCells', 'tableProperties', 'tableCellProperties'],
  },
}
</script>

<template>
  <div class="rte-wrap">
    <Ckeditor
      :editor="ClassicEditor"
      :model-value="internalValue"
      :config="editorConfig"
      @update:model-value="onUpdate"
      @focus="onFocus"
      @blur="onBlur"
    />
  </div>
</template>
