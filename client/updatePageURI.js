export default function updatePageURI({ href }) {
  const link = document.getElementById('this-page')
  link.href = link.textContent = href
}
