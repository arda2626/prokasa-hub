console.log("ProKasa Hub yüklendi.");

// Menü tıklamalarını ileride buradan yöneteceğiz
document.querySelectorAll(".card").forEach(card => {
    card.addEventListener("click", () => {
        alert("Bu bölüm henüz aktif değil. Birlikte ekleyeceğiz!");
    });
});
