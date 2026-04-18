import { createRouter, createWebHistory } from 'vue-router'
import Home from '../views/Home.vue'
import Post from '../views/Post.vue'
import RAG from '../views/RAG.vue'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: Home
  },
  {
    path: '/post/:id',
    name: 'Post',
    component: Post
  },
  {
    path: '/rag',
    name: 'RAG',
    component: RAG
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router