;; Property Verification Contract
;; Validates the legal status and condition of a property

(define-data-var contract-owner principal tx-sender)

;; Property status: 0 = unverified, 1 = verified, 2 = rejected
(define-map properties
  { property-id: (string-ascii 36) }
  {
    status: uint,
    legal-owner: principal,
    address: (string-ascii 256),
    last-inspection-date: uint,
    verified-by: (optional principal)
  }
)

;; List of authorized verifiers
(define-map authorized-verifiers
  { verifier: principal }
  { is-authorized: bool }
)

;; Initialize contract owner
(define-public (initialize-contract)
  (begin
    (asserts! (is-eq tx-sender (var-get contract-owner)) (err u100))
    (ok true)
  )
)

;; Add a new authorized verifier
(define-public (add-verifier (verifier principal))
  (begin
    (asserts! (is-eq tx-sender (var-get contract-owner)) (err u101))
    (map-set authorized-verifiers { verifier: verifier } { is-authorized: true })
    (ok true)
  )
)

;; Remove an authorized verifier
(define-public (remove-verifier (verifier principal))
  (begin
    (asserts! (is-eq tx-sender (var-get contract-owner)) (err u101))
    (map-set authorized-verifiers { verifier: verifier } { is-authorized: false })
    (ok true)
  )
)

;; Register a new property
(define-public (register-property
  (property-id (string-ascii 36))
  (address (string-ascii 256))
)
  (begin
    (asserts! (is-none (map-get? properties { property-id: property-id })) (err u102))
    (map-set properties
      { property-id: property-id }
      {
        status: u0,
        legal-owner: tx-sender,
        address: address,
        last-inspection-date: u0,
        verified-by: none
      }
    )
    (ok true)
  )
)

;; Verify a property
(define-public (verify-property
  (property-id (string-ascii 36))
)
  (let (
    (verifier-status (default-to { is-authorized: false } (map-get? authorized-verifiers { verifier: tx-sender })))
    (property (map-get? properties { property-id: property-id }))
  )
    (asserts! (get is-authorized verifier-status) (err u103))
    (asserts! (is-some property) (err u104))

    (map-set properties
      { property-id: property-id }
      (merge (unwrap-panic property)
        {
          status: u1,
          last-inspection-date: block-height,
          verified-by: (some tx-sender)
        }
      )
    )
    (ok true)
  )
)

;; Reject a property
(define-public (reject-property
  (property-id (string-ascii 36))
  (reason (string-ascii 256))
)
  (let (
    (verifier-status (default-to { is-authorized: false } (map-get? authorized-verifiers { verifier: tx-sender })))
    (property (map-get? properties { property-id: property-id }))
  )
    (asserts! (get is-authorized verifier-status) (err u103))
    (asserts! (is-some property) (err u104))

    (map-set properties
      { property-id: property-id }
      (merge (unwrap-panic property)
        {
          status: u2,
          last-inspection-date: block-height,
          verified-by: (some tx-sender)
        }
      )
    )
    (ok true)
  )
)

;; Get property details
(define-read-only (get-property-details (property-id (string-ascii 36)))
  (map-get? properties { property-id: property-id })
)

;; Check if a property is verified
(define-read-only (is-property-verified (property-id (string-ascii 36)))
  (let ((property (map-get? properties { property-id: property-id })))
    (if (is-some property)
      (is-eq (get status (unwrap-panic property)) u1)
      false
    )
  )
)

