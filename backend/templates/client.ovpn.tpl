##############################################
# WitsCyber VPN Client Configuration Template
# This template is not used by the bash script
# but kept for reference
##############################################

client
dev tun
proto {{PROTOCOL}}
remote {{SERVER_HOST}} {{SERVER_PORT}}
resolv-retry infinite
nobind
persist-key
persist-tun
remote-cert-tls server
cipher AES-256-GCM
auth SHA256
verb 3
key-direction 1

<ca>
{{CA_CERT}}
</ca>

<cert>
{{CLIENT_CERT}}
</cert>

<key>
{{CLIENT_KEY}}
</key>
