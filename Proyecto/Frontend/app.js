document.addEventListener('DOMContentLoaded', () => {
    const dnsForm = document.getElementById('dnsForm');
    const portToggles = document.querySelectorAll('.port-toggle');
    const summaryTitle = document.getElementById('summaryTitle');
    const openPortsCount = document.getElementById('openPortsCount');
    const externalAccess = document.getElementById('externalAccess');
    const policyStatus = document.getElementById('policyStatus');

    const updateFirewallSummary = () => {
        const activePorts = [...portToggles].filter((toggle) => toggle.classList.contains('active')).length;
        const isOpen = activePorts >= 3;

        summaryTitle.textContent = isOpen ? 'Firewall protegido' : 'Acceso restringido';
        openPortsCount.textContent = String(activePorts);
        externalAccess.textContent = isOpen ? 'Permitido' : 'Bloqueado';
        policyStatus.textContent = isOpen ? 'Política activa' : 'Reglas reforzadas';
        policyStatus.style.color = isOpen ? '#4cc9f0' : '#fbbf24';
    };

    portToggles.forEach((toggle) => {
        toggle.addEventListener('click', () => {
            toggle.classList.toggle('active');
            toggle.classList.toggle('inactive');
            updateFirewallSummary();
        });
    });

    if (dnsForm) {
        dnsForm.addEventListener('submit', (event) => {
            event.preventDefault();

            const domain = document.getElementById('domainInput').value.trim() || 'nexus.local';
            const subnet = document.getElementById('subnetInput').value.trim() || '192.168.10.0/24';
            const resolvedIp = subnet.includes('10') ? '192.168.10.12' : '10.0.0.8';
            const ttl = domain.includes('nexus') ? '300 s' : '600 s';

            const resultBox = document.getElementById('dnsResult');
            resultBox.innerHTML = `
                <div class="result-row">
                    <span>DNS</span>
                    <strong>ns1.${domain}</strong>
                </div>
                <div class="result-row">
                    <span>IP asignada</span>
                    <strong>${resolvedIp}</strong>
                </div>
                <div class="result-row">
                    <span>TTL</span>
                    <strong>${ttl}</strong>
                </div>
            `;
        });
    }

    document.querySelector('.secondary-btn')?.addEventListener('click', () => {
        document.getElementById('diagnostico')?.scrollIntoView({ behavior: 'smooth' });
    });

    updateFirewallSummary();
});
>>>>>>> 7ffac88 (Mejora landing page de redes)
