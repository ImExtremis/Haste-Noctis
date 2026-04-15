cask "noctis" do
  arch arm: "arm64", intel: "x64"

  version "PLACEHOLDER_VERSION"

  on_arm do
    sha256 "PLACEHOLDER_SHA256_ARM64"
  end
  on_intel do
    sha256 "PLACEHOLDER_SHA256_X64"
  end

  url "https://api.noctis.app/dl/desktop/stable/darwin/#{arch}/#{version}/dmg"
  name "Noctis"
  desc "Instant messaging and VoIP application"
  homepage "https://noctis.app"

  livecheck do
    url "https://api.noctis.app/dl/desktop/stable/darwin/arm64/latest"
    strategy :json do |json|
      json["version"]
    end
  end

  auto_updates true
  depends_on macos: ">= :catalina"

  app "noctis.app"

  zap trash: [
    "~/Library/Application Support/Noctis",
    "~/Library/Caches/app.noctis",
    "~/Library/Caches/app.noctis.ShipIt",
    "~/Library/Preferences/app.noctis.plist",
    "~/Library/Saved Application State/app.noctis.savedState",
  ]
end
