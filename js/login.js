       // Configuração do Supabase
        const supabaseUrl = 'https://chsjlvtedrujhhjvonqf.supabase.co';
        const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNoc2psdnRlZHJ1amhoanZvbnFmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjgxNTQ0MiwiZXhwIjoyMDcyMzkxNDQyfQ.leLl8Mg3hWbdyk3WYiybXpatX69rSsBM4hFT3DQ2I00';
        const supabaseClient = supabase.createClient(supabaseUrl, supabaseKey);

        // Sticky Header
        window.addEventListener("scroll", function() {
            var header = document.querySelector("header");
            header.classList.toggle("sticky", window.scrollY > 0);
        });

        // Pop-up Login
        const popUp = document.getElementById("pop");
        const popupOverlay = document.getElementById("popup-overlay");
        const closeBtn = document.getElementById("close-popup");
        const loginForm = document.getElementById("login-form");
        const loginButton = document.getElementById("login-button");

        function openPopup() {
            popupOverlay.style.display = 'block';
            popUp.style.display = 'block';
            
            // Trigger animations
            setTimeout(() => {
                popupOverlay.classList.add("show");
                popUp.classList.add("show");
            }, 10);
        }

        function closePopup() {
            popupOverlay.classList.remove("show");
            popUp.classList.remove("show");
            
            setTimeout(() => {
                if (!chameleonPopup.classList.contains("show")) {
                    popupOverlay.style.display = "none";
                }
                popUp.style.display = "none";
                document.getElementById("login-message").textContent = ""; // Clear message on close
            }, 300);
        }

        // Pop-up Camaleão
        const chameleonBtn = document.getElementById("chameleon-btn");
        const chameleonPopup = document.getElementById("chameleon-popup");
        const chameleonCloseBtn = document.getElementById("chameleon-close-popup");

        // Event listeners para abrir e fechar o pop-up de login
        document.querySelector("#abrir-popup-fixed").addEventListener("click", function(event) {
            event.preventDefault();
            openPopup();
        });

        closeBtn.addEventListener('click', closePopup);

        // Close popup when clicking on overlay
        popupOverlay.addEventListener('click', function(e) {
            if (e.target === popupOverlay) {
                if (popUp.classList.contains('show')) {
                    closePopup();
                }
            }
        });

        // Close popup with Escape key
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape' && popUp.classList.contains('show')) {
                closePopup();
            }
            if (e.key === 'Escape' && chameleonPopup.classList.contains('show')) {
                closeChameleonPopup();
            }
        });

        // Funções do pop-up do camaleão
        function openChameleonPopup() {
            popupOverlay.style.display = 'block';
            chameleonPopup.style.display = 'block';
            
            // Trigger animations
            setTimeout(() => {
                popupOverlay.classList.add('show');
                chameleonPopup.classList.add('show');
            }, 10);
        }

        function closeChameleonPopup() {
            popupOverlay.classList.remove('show');
            chameleonPopup.classList.remove('show');
            
            setTimeout(() => {
                if (!popUp.classList.contains('show')) {
                    popupOverlay.style.display = 'none';
                }
                chameleonPopup.style.display = 'none';
            }, 300);
        }

        // Event listeners do camaleão
        chameleonBtn.addEventListener('click', function(event) {
            event.preventDefault();
            openChameleonPopup();
        });

        chameleonCloseBtn.addEventListener('click', closeChameleonPopup);

        // Close chameleon popup when clicking on overlay (but not if login popup is open)
        popupOverlay.addEventListener('click', function(e) {
            if (e.target === popupOverlay) {
                if (chameleonPopup.classList.contains('show')) {
                    closeChameleonPopup();
                } else if (popUp.classList.contains('show')) {
                    closePopup();
                }
            }
        });

        // Form submission with loading state
        loginForm.addEventListener("submit", async function(e) {
            e.preventDefault();
            
            const loginMessage = document.getElementById("login-message");
            loginMessage.textContent = ""; // Clear previous messages

            // Add loading state
            loginButton.classList.add("loading");
            loginButton.textContent = "";
            
            const email = document.getElementById("email-input").value;
            const password = document.getElementById("password-input").value;

            // Use supabaseClient para autenticação
            const { data, error } = await supabaseClient.auth.signInWithPassword({
                email: email,
                password: password,
            });

            // Remove loading state
            loginButton.classList.remove("loading");
            loginButton.textContent = "Entrar";

            if (error) {
                loginMessage.textContent = error.message;
            } else {
                loginMessage.style.color = "green";
                loginMessage.textContent = "Login realizado com sucesso!";
                setTimeout(() => {
                    closePopup();
                                        window.location.href = "page/departamentos.html";
                }, 1000);
            }
        });

        // Input focus effects
        const inputs = document.querySelectorAll('.pop-up input');
        inputs.forEach(input => {
            input.addEventListener('focus', function() {
                this.parentElement.classList.add('focused');
            });
            
            input.addEventListener('blur', function() {
                this.parentElement.classList.remove('focused');
            });
        });

        // Prevent form submission on Enter in individual inputs
        inputs.forEach(input => {
            input.addEventListener('keypress', function(e) {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    const nextInput = this.parentElement.nextElementSibling?.querySelector('input');
                    if (nextInput) {
                        nextInput.focus();
                    } else {
                        loginForm.dispatchEvent(new Event('submit'));
                    }
                }
            });
        });
    

